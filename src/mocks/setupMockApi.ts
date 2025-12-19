import { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { v4 as uuidv4 } from 'uuid';
import {
  mockDb,
  getDietDayForDate,
  recalculateDietDayTotals,
  ensureWorkoutSession,
} from './mockData';
import {
  DietDay,
  DietPlan,
  Exercise,
  FoodItem,
  FoodLog,
  WorkoutProgram,
  WorkoutSession,
  BodyMetric,
  DietAdherenceData,
  TrainingVolumeData,
} from '../types';

const parseBody = (data?: string) => {
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const findDietItem = (itemId: string): { day: DietDay; inMeals: boolean; index: number; mealIndex?: number } | null => {
  for (const day of Object.values(mockDb.dietDays)) {
    for (let mealIndex = 0; mealIndex < day.meals.length; mealIndex += 1) {
      const meal = day.meals[mealIndex];
      const index = meal.items.findIndex((item) => item.id === itemId);
      if (index >= 0) {
        return { day, inMeals: true, mealIndex, index };
      }
    }
    const adHocIndex = day.adHocItems.findIndex((item) => item.id === itemId);
    if (adHocIndex >= 0) {
      return { day, inMeals: false, index: adHocIndex };
    }
  }
  return null;
};

const filterByDateRange = <T extends { date: string }>(items: T[], from?: string, to?: string): T[] =>
  items.filter((item) => {
    if (from && item.date < from) return false;
    if (to && item.date > to) return false;
    return true;
  });

const toISODate = (value?: string) => (value ? value : new Date().toISOString().slice(0, 10));

export const setupMockApi = (client: AxiosInstance): void => {
  const mock = new MockAdapter(client, { delayResponse: 400 });

  // Auth endpoints
  mock.onPost('/auth/login').reply((config) => {
    const body = parseBody(config.data);
    if (body?.email) {
      mockDb.user.email = body.email;
    }
    return [200, { user: mockDb.user, tokens: mockDb.tokens }];
  });

  mock.onPost('/auth/register').reply((config) => {
    const body = parseBody(config.data);
    if (body?.email) {
      mockDb.user.email = body.email;
    }
    return [200, { user: mockDb.user, tokens: mockDb.tokens }];
  });

  mock.onPost('/auth/logout').reply(200);
  mock.onPost('/auth/refresh').reply(200, { tokens: mockDb.tokens });
  mock.onGet('/me').reply(200, { ...mockDb.user });

  // Diet endpoints
  mock.onGet('/diet/today').reply((config) => {
    const date = config.params?.date || todayStr();
    return [200, getDietDayForDate(date)];
  });

  mock.onPatch('/diet/log').reply((config) => {
    const body = parseBody(config.data);
    const date = body.date || todayStr();
    const day = getDietDayForDate(date);
    const food = mockDb.foodItems.find((item) => item.id === body.foodId) ?? mockDb.foodItems[0];
    const adHocItem = {
      id: uuidv4(),
      foodId: food.id,
      food,
      plannedQuantity: 0,
      actualQuantity: body.quantity ?? 0,
      isEaten: true,
      mealId: 'adHoc',
    };
    day.adHocItems.push(adHocItem);
    recalculateDietDayTotals(date);

    const log: FoodLog = {
      id: uuidv4(),
      userId: mockDb.user.id,
      foodId: food.id,
      food,
      quantity: body.quantity ?? 0,
      date,
      mealId: body.mealId,
      createdAt: new Date().toISOString(),
    };
    mockDb.foodLogs.push(log);
    return [200, log];
  });

  mock.onPatch(/\/diet\/items\/(.+)/).reply((config) => {
    const match = config.url?.match(/\/diet\/items\/(.+)/);
    const body = parseBody(config.data);
    if (!match) return [404];
    const itemInfo = findDietItem(match[1]);
    if (!itemInfo) return [404];
    const { day, inMeals, index, mealIndex } = itemInfo;
    const target = inMeals && typeof mealIndex === 'number' ? day.meals[mealIndex].items[index] : day.adHocItems[index];
    if (typeof body.quantity === 'number') {
      target.plannedQuantity = body.quantity;
    }
    if (typeof body.isEaten === 'boolean') {
      target.isEaten = body.isEaten;
      if (body.isEaten && typeof body.quantity === 'number') {
        target.actualQuantity = body.quantity;
      } else if (body.isEaten) {
        target.actualQuantity = target.actualQuantity ?? target.plannedQuantity;
      } else {
        target.actualQuantity = 0;
      }
    }
    recalculateDietDayTotals(day.date);
    return [200];
  });

  mock.onGet('/diet/plans').reply(200, mockDb.dietPlans);
  mock.onPost('/diet/plans').reply((config) => {
    const body = parseBody(config.data);
    const newPlan: DietPlan = {
      id: uuidv4(),
      name: body.name || 'Custom Plan',
      userId: mockDb.user.id,
      daysOfWeek: body.daysOfWeek ?? [1, 3, 5],
      meals: body.meals ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.dietPlans.push(newPlan);
    return [200, newPlan];
  });

  mock.onPatch(/\/diet\/plans\/(.+)/).reply((config) => {
    const match = config.url?.match(/\/diet\/plans\/(.+)/);
    const body = parseBody(config.data);
    if (!match) return [404];
    const plan = mockDb.dietPlans.find((p) => p.id === match[1]);
    if (!plan) return [404];
    Object.assign(plan, body, { updatedAt: new Date().toISOString() });
    return [200, plan];
  });

  mock.onGet('/foods/search').reply((config) => {
    const query = (config.params?.q || '').toLowerCase();
    if (!query) {
      return [200, mockDb.foodItems.slice(0, 5)];
    }
    const results = mockDb.foodItems.filter((food) => food.name.toLowerCase().includes(query));
    return [200, results];
  });

  // Workout endpoints
  mock.onGet('/workout/today').reply((config) => {
    const date = config.params?.date || todayStr();
    return [200, date === todayStr() ? mockDb.workoutToday : mockDb.workoutToday];
  });

  mock.onPost('/workout/sessions').reply((config) => {
    const body = parseBody(config.data);
    const date = body.date || todayStr();
    const created: WorkoutSession = {
      id: uuidv4(),
      userId: mockDb.user.id,
      workoutId: body.workoutId,
      workout: mockDb.workoutToday ?? undefined,
      name: body.name,
      date,
      startTime: body.startTime ?? '18:00',
      endTime: body.endTime ?? '19:00',
      exercises: (body.exercises ?? []).map((ex: any) => ({
        id: uuidv4(),
        exerciseId: ex.exerciseId,
        exercise: mockDb.exercises.find((exercise) => exercise.id === ex.exerciseId) ?? mockDb.exercises[0],
        sets: (ex.sets ?? []).map((set: any) => ({
          id: uuidv4(),
          weight: set.weight ?? 0,
          reps: set.reps ?? 0,
          completed: true,
        })),
      })),
      totals: {
        totalSets: body.exercises?.reduce((sum: number, ex: any) => sum + (ex.sets?.length ?? 0), 0) ?? 0,
        totalVolume:
          body.exercises?.reduce(
            (sum: number, ex: any) =>
              sum + (ex.sets ?? []).reduce((setSum: number, set: any) => setSum + (set.weight ?? 0) * (set.reps ?? 0), 0),
            0
          ) ?? 0,
        duration: 60,
      },
      isSynced: true,
      syncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mockDb.workoutSessions.unshift(created);
    return [200, created];
  });

  mock.onGet('/workout/sessions').reply((config) => {
    const { from, to } = config.params || {};
    const data = filterByDateRange(mockDb.workoutSessions, from, to);
    return [200, data];
  });

  mock.onGet(/\/workout\/sessions\/([^/]+)/).reply((config) => {
    const match = config.url?.match(/\/workout\/sessions\/([^/]+)/);
    if (!match) return [404];
    const session = ensureWorkoutSession(match[1]);
    if (!session) return [404];
    return [200, session];
  });

  mock.onGet('/workout/programs').reply(200, mockDb.workoutPrograms);
  mock.onPost('/workout/programs').reply((config) => {
    const body = parseBody(config.data);
    const program: WorkoutProgram = {
      id: uuidv4(),
      name: body.name || 'Custom Program',
      userId: mockDb.user.id,
      frequency: body.frequency ?? 3,
      split: body.split ?? {},
      workouts: body.workouts ?? {},
      isCurrent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.workoutPrograms.push(program);
    return [200, program];
  });

  mock.onPatch(/\/workout\/programs\/(.+)/).reply((config) => {
    const match = config.url?.match(/\/workout\/programs\/(.+)/);
    const body = parseBody(config.data);
    if (!match) return [404];
    const program = mockDb.workoutPrograms.find((p) => p.id === match[1]);
    if (!program) return [404];
    Object.assign(program, body, { updatedAt: new Date().toISOString() });
    return [200, program];
  });

  mock.onGet('/exercises/search').reply((config) => {
    const query = (config.params?.q || '').toLowerCase();
    if (!query) {
      return [200, mockDb.exercises.slice(0, 5)];
    }
    const results = mockDb.exercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
    return [200, results];
  });

  // Progress endpoints
  mock.onGet('/progress/weight').reply((config) => {
    const { from, to } = config.params || {};
    const entries = filterByDateRange(mockDb.weightEntries, from, to);
    return [200, entries];
  });

  mock.onPost('/progress/weight').reply((config) => {
    const body = parseBody(config.data);
    const entry: BodyMetric = {
      id: uuidv4(),
      userId: mockDb.user.id,
      date: body.date || todayStr(),
      weight: body.weight ?? 80,
      createdAt: new Date().toISOString(),
    };
    mockDb.weightEntries.push(entry);
    return [200, entry];
  });

  mock.onGet('/progress/diet-adherence').reply((config) => {
    const { from, to } = config.params || {};
    const data = filterByDateRange(mockDb.dietAdherence, from, to);
    return [200, data];
  });

  mock.onGet('/progress/training-volume').reply((config) => {
    const { from, to } = config.params || {};
    const data = filterByDateRange(mockDb.trainingVolume, from, to);
    return [200, data];
  });
};

const todayStr = () => new Date().toISOString().slice(0, 10);


