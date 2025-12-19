import { addDays, subDays, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
  AuthTokens,
  BodyMetric,
  DietAdherenceData,
  DietDay,
  DietItem,
  DietMeal,
  DietPlan,
  Exercise,
  FoodItem,
  FoodLog,
  MacroTotals,
  Profile,
  TrainingVolumeData,
  User,
  Workout,
  WorkoutProgram,
  WorkoutSession,
  WorkoutSet,
} from '../types';

export interface MockDatabase {
  user: User & { profile: Profile };
  tokens: AuthTokens;
  dietPlans: DietPlan[];
  dietDays: Record<string, DietDay>;
  foodItems: FoodItem[];
  foodLogs: FoodLog[];
  workoutToday: Workout | null;
  workoutPrograms: WorkoutProgram[];
  workoutSessions: WorkoutSession[];
  exercises: Exercise[];
  weightEntries: BodyMetric[];
  dietAdherence: DietAdherenceData[];
  trainingVolume: TrainingVolumeData[];
}

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');

const foodItems: FoodItem[] = [
  {
    id: 'food_chicken',
    name: 'Chicken Breast',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    unit: 'g',
  },
  {
    id: 'food_rice',
    name: 'Jasmine Rice',
    calories: 130,
    protein: 2.4,
    carbs: 28,
    fat: 0.3,
    unit: 'g',
  },
  {
    id: 'food_oats',
    name: 'Rolled Oats',
    calories: 389,
    protein: 17,
    carbs: 66,
    fat: 7,
    unit: 'g',
  },
  {
    id: 'food_banana',
    name: 'Banana',
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    unit: 'g',
  },
  {
    id: 'food_whey',
    name: 'Whey Protein',
    calories: 400,
    protein: 80,
    carbs: 10,
    fat: 7,
    unit: 'g',
  },
  {
    id: 'food_avocado',
    name: 'Avocado',
    calories: 160,
    protein: 2,
    carbs: 9,
    fat: 15,
    unit: 'g',
  },
];

const cloneMeal = (meal: DietMeal, date: string): DietMeal => ({
  ...meal,
  items: meal.items.map((item) => ({
    ...item,
    id: `${item.id}_${date}`,
    actualQuantity: item.isEaten ? item.actualQuantity ?? item.plannedQuantity : item.actualQuantity,
  })),
});

const calculateTotals = (meals: DietMeal[], adHocItems: DietItem[]): { planned: MacroTotals; actual: MacroTotals } => {
  const totals: { planned: MacroTotals; actual: MacroTotals } = {
    planned: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    actual: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  };

  const accumulate = (item: DietItem, target: 'planned' | 'actual') => {
    const food = item.food;
    const grams =
      target === 'planned'
        ? item.plannedQuantity
        : item.actualQuantity ?? (item.isEaten ? item.plannedQuantity : 0);
    const factor = grams / 100;
    totals[target].calories += food.calories * factor;
    totals[target].protein += food.protein * factor;
    totals[target].carbs += food.carbs * factor;
    totals[target].fat += food.fat * factor;
  };

  meals.forEach((meal) => {
    meal.items.forEach((item) => {
      accumulate(item, 'planned');
      accumulate(item, 'actual');
    });
  });

  adHocItems.forEach((item) => {
    accumulate(item, 'actual');
  });

  const roundTotals = (macro: MacroTotals): MacroTotals => ({
    calories: Math.round(macro.calories),
    protein: Math.round(macro.protein),
    carbs: Math.round(macro.carbs),
    fat: Math.round(macro.fat),
  });

  return {
    planned: roundTotals(totals.planned),
    actual: roundTotals(totals.actual),
  };
};

const createMeal = (name: string, time: string, entries: Array<{ foodId: string; quantity: number; eaten?: boolean }>): DietMeal => ({
  id: uuidv4(),
  name,
  time,
  items: entries.map((entry) => {
    const food = foodItems.find((f) => f.id === entry.foodId)!;
    return {
      id: uuidv4(),
      foodId: food.id,
      food,
      plannedQuantity: entry.quantity,
      actualQuantity: entry.eaten ? entry.quantity : undefined,
      isEaten: !!entry.eaten,
      mealId: name.toLowerCase(),
    };
  }),
});

const baseMeals: DietMeal[] = [
  createMeal('Breakfast', '08:00', [
    { foodId: 'food_oats', quantity: 80, eaten: true },
    { foodId: 'food_banana', quantity: 120, eaten: true },
    { foodId: 'food_whey', quantity: 35, eaten: true },
  ]),
  createMeal('Lunch', '12:30', [
    { foodId: 'food_chicken', quantity: 180, eaten: true },
    { foodId: 'food_rice', quantity: 200, eaten: true },
    { foodId: 'food_avocado', quantity: 70, eaten: true },
  ]),
  createMeal('Dinner', '19:00', [
    { foodId: 'food_chicken', quantity: 170 },
    { foodId: 'food_rice', quantity: 180 },
    { foodId: 'food_avocado', quantity: 50 },
  ]),
];

const basePlan: DietPlan = {
  id: 'plan_balanced',
  name: 'Balanced Performance Plan',
  userId: 'user_1',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  meals: baseMeals,
  isCurrent: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createDietDay = (date: string): DietDay => {
  const meals = basePlan.meals.map((meal) => cloneMeal(meal, date));
  const totals = calculateTotals(meals, []);
  const adherence =
    totals.planned.calories > 0
      ? Math.min(100, Math.round((totals.actual.calories / totals.planned.calories) * 100))
      : 100;

  return {
    date,
    planId: basePlan.id,
    plan: basePlan,
    meals,
    adHocItems: [],
    totals,
    adherence,
  };
};

const seedDietDays: Record<string, DietDay> = {};
for (let i = 0; i < 4; i += 1) {
  const date = format(subDays(today, i), 'yyyy-MM-dd');
  seedDietDays[date] = createDietDay(date);
}

const exercises: Exercise[] = [
  { id: 'ex_pushup', name: 'Push Ups', category: 'strength', muscleGroup: ['chest', 'triceps'] },
  { id: 'ex_squat', name: 'Back Squat', category: 'strength', muscleGroup: ['legs'] },
  { id: 'ex_deadlift', name: 'Deadlift', category: 'strength', muscleGroup: ['back', 'legs'] },
  { id: 'ex_row', name: 'Bent Over Row', category: 'strength', muscleGroup: ['back', 'biceps'] },
  { id: 'ex_run', name: 'Easy Run', category: 'cardio', muscleGroup: ['full_body'] },
];

const createSet = (weight: number, reps: number, completed = true): WorkoutSet => ({
  id: uuidv4(),
  weight,
  reps,
  completed,
});

const workoutToday: Workout = {
  id: 'workout_push',
  name: 'Upper Body Push',
  estimatedDuration: 55,
  exercises: [
    {
      id: uuidv4(),
      exerciseId: 'ex_pushup',
      exercise: exercises[0],
      targetSets: 4,
      targetRepsMin: 8,
      targetRepsMax: 12,
      sets: [createSet(0, 15), createSet(0, 15), createSet(0, 15)],
      order: 1,
    },
    {
      id: uuidv4(),
      exerciseId: 'ex_squat',
      exercise: exercises[1],
      targetSets: 4,
      targetRepsMin: 6,
      targetRepsMax: 8,
      sets: [createSet(100, 6), createSet(100, 6), createSet(100, 6)],
      order: 2,
    },
  ],
};

const buildWorkoutSession = (daysAgo: number): WorkoutSession => {
  const date = format(subDays(today, daysAgo), 'yyyy-MM-dd');
  const exercisesCompleted = workoutToday.exercises.map((exercise) => ({
    id: uuidv4(),
    exerciseId: exercise.exerciseId,
    exercise: exercise.exercise,
    sets: exercise.sets.map((set) => ({ ...set, id: uuidv4() })),
  }));

  const totalVolume = exercisesCompleted.reduce(
    (sum, exercise) =>
      sum +
      exercise.sets.reduce((setSum, set) => setSum + set.weight * set.reps, 0),
    0
  );

  return {
    id: uuidv4(),
    userId: 'user_1',
    workoutId: workoutToday.id,
    workout: workoutToday,
    name: workoutToday.name,
    date,
    startTime: '18:00',
    endTime: '19:00',
    exercises: exercisesCompleted,
    totals: {
      totalSets: exercisesCompleted.reduce((sum, ex) => sum + ex.sets.length, 0),
      totalVolume,
      duration: 60,
    },
    isSynced: true,
    syncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
};

const workoutSessions = [buildWorkoutSession(1), buildWorkoutSession(3), buildWorkoutSession(5)];

const workoutPrograms: WorkoutProgram[] = [
  {
    id: 'program_push_pull_legs',
    name: 'Push / Pull / Legs',
    userId: 'user_1',
    frequency: 5,
    split: {
      1: 'Push',
      2: 'Pull',
      3: 'Legs',
      5: 'Upper',
      6: 'Lower',
    },
    workouts: {
      Push: workoutToday,
    },
    isCurrent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const weightEntries: BodyMetric[] = Array.from({ length: 10 }).map((_, idx) => {
  const date = format(subDays(today, 9 - idx), 'yyyy-MM-dd');
  return {
    id: uuidv4(),
    userId: 'user_1',
    date,
    weight: 82 + Math.sin(idx / 2) * 0.5,
    createdAt: new Date().toISOString(),
  };
});

const dietAdherence: DietAdherenceData[] = Array.from({ length: 14 }).map((_, idx) => {
  const date = format(subDays(today, 13 - idx), 'yyyy-MM-dd');
  const calories = 2400 + Math.sin(idx) * 150;
  const targetCalories = 2500;
  const adherence = Math.round((calories / targetCalories) * 100);
  return {
    date,
    calories,
    protein: 180,
    carbs: 260,
    fat: 70,
    targetCalories,
    adherence,
    status: adherence > 90 ? 'green' : adherence > 75 ? 'yellow' : 'red',
  };
});

const trainingVolume: TrainingVolumeData[] = Array.from({ length: 8 }).map((_, idx) => {
  const date = format(subDays(today, (7 - idx) * 3), 'yyyy-MM-dd');
  const totalVolume = 17000 + idx * 500;
  return {
    date,
    totalVolume,
    volumeByMuscleGroup: {
      chest: 4000 + idx * 200,
      back: 4200 + idx * 150,
      legs: 6000 + idx * 300,
      shoulders: 2800 + idx * 120,
    },
    volumeByExercise: {
      ex_pushup: 2000 + idx * 80,
      ex_squat: 5000 + idx * 250,
      ex_deadlift: 6000 + idx * 260,
    },
  };
});

const mockUser: User & { profile: Profile } = {
  id: 'user_1',
  email: 'coach@trackforge.com',
  createdAt: new Date().toISOString(),
  profile: {
    userId: 'user_1',
    age: 32,
    sex: 'male',
    height: 182,
    weight: 82.5,
    goal: 'maintain',
    activityLevel: 'moderate',
    units: {
      weight: 'kg',
      height: 'cm',
      energy: 'kcal',
    },
  },
};

const mockTokens: AuthTokens = {
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token',
};

export const mockDb: MockDatabase = {
  user: mockUser,
  tokens: mockTokens,
  dietPlans: [basePlan],
  dietDays: seedDietDays,
  foodItems,
  foodLogs: [],
  workoutToday,
  workoutPrograms,
  workoutSessions,
  exercises,
  weightEntries,
  dietAdherence,
  trainingVolume,
};

export const getDietDayForDate = (date: string): DietDay => {
  if (!mockDb.dietDays[date]) {
    mockDb.dietDays[date] = createDietDay(date);
  }
  return mockDb.dietDays[date];
};

export const recalculateDietDayTotals = (date: string): void => {
  const day = getDietDayForDate(date);
  day.totals = calculateTotals(day.meals, day.adHocItems);
  day.adherence =
    day.totals.planned.calories > 0
      ? Math.min(100, Math.round((day.totals.actual.calories / day.totals.planned.calories) * 100))
      : 100;
};

export const ensureWorkoutSession = (sessionId: string): WorkoutSession | undefined =>
  mockDb.workoutSessions.find((session) => session.id === sessionId);


