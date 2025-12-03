// File: src/types/index.ts

// User & Auth
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Profile {
  userId: string;
  age?: number;
  sex?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'lose' | 'maintain' | 'gain';
  units?: {
    weight: 'kg' | 'lb';
    height: 'cm' | 'ft';
    energy: 'kcal' | 'kJ';
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Diet Domain
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number; // per 100g
  protein: number; // per 100g
  carbs: number; // per 100g
  fat: number; // per 100g
  fiber?: number;
  unit: 'g' | 'ml' | 'piece';
}

export interface DietItem {
  id: string;
  foodId: string;
  food: FoodItem;
  plannedQuantity: number;
  actualQuantity?: number;
  isEaten: boolean;
  mealId: string;
}

export interface DietMeal {
  id: string;
  name: string;
  time?: string; // HH:mm format
  items: DietItem[];
}

export interface DietPlan {
  id: string;
  name: string;
  userId: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  meals: DietMeal[];
  isCurrent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DietDay {
  date: string; // YYYY-MM-DD
  planId?: string;
  plan?: DietPlan;
  meals: DietMeal[];
  adHocItems: DietItem[]; // Items added off-plan
  totals: {
    planned: MacroTotals;
    actual: MacroTotals;
  };
  adherence: number; // 0-100
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodLog {
  id: string;
  userId: string;
  foodId: string;
  food: FoodItem;
  quantity: number;
  date: string;
  mealId?: string;
  createdAt: string;
}

// Workout Domain
export interface Exercise {
  id: string;
  name: string;
  equipmentType?: string;
  muscleGroup?: string[];
  category: 'strength' | 'cardio' | 'flexibility' | 'other';
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion 1-10
  completed: boolean;
  restTime?: number; // seconds
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  targetSets: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetWeight?: number;
  sets: WorkoutSet[];
  order: number;
}

export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  estimatedDuration?: number; // minutes
  programId?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutId?: string;
  workout?: Workout;
  name: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  exercises: {
    id: string;
    exerciseId: string;
    exercise: Exercise;
    sets: WorkoutSet[];
  }[];
  totals: {
    totalSets: number;
    totalVolume: number; // sum of (weight × reps)
    duration?: number; // minutes
  };
  isSynced: boolean;
  syncedAt?: string;
  createdAt: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  userId: string;
  frequency: number; // days per week
  split: {
    [dayOfWeek: number]: string; // e.g., { 1: "Push", 2: "Pull", 3: "Legs" }
  };
  workouts: {
    [workoutName: string]: Workout;
  };
  isCurrent?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Progress Domain
export interface BodyMetric {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  createdAt: string;
}

export interface DietAdherenceData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories: number;
  adherence: number;
  status: 'green' | 'yellow' | 'red';
}

export interface TrainingVolumeData {
  date: string;
  totalVolume: number;
  volumeByMuscleGroup: {
    [muscleGroup: string]: number;
  };
  volumeByExercise: {
    [exerciseId: string]: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// UI State
export interface OfflineQueueItem {
  id: string;
  type: 'workout_session';
  data: Partial<WorkoutSession>;
  timestamp: string;
  retries: number;
}

