// File: src/api/endpoints/diet.ts

import { apiClient } from '../client';
import { DietDay, DietPlan, FoodItem, FoodLog } from '../../types';

export interface LogDietItemRequest {
  meal_id?: string;
  food_id: string;
  quantity: number;
  date: string;
  is_ad_hoc?: boolean;
}

export interface CreateDietPlanRequest {
  name: string;
  days_of_week: number[];
  meals: Array<{
    name: string;
    time?: string;
    items: Array<{
      food_id: string;
      planned_quantity: number;
    }>;
  }>;
}

// Transform snake_case to camelCase for frontend types
function transformFoodItem(item: any): FoodItem {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    unit: item.unit,
  };
}

function transformDietPlan(plan: any): DietPlan {
  return {
    id: plan.id,
    name: plan.name,
    userId: plan.user_id,
    daysOfWeek: plan.days_of_week,
    meals: (plan.meals || []).map((meal: any) => ({
      id: meal.id,
      name: meal.name,
      time: meal.time,
      items: (meal.items || []).map((item: any) => ({
        id: item.id,
        foodId: item.food_id,
        food: transformFoodItem(item.food),
        plannedQuantity: item.planned_quantity,
        actualQuantity: item.actual_quantity,
        isEaten: item.is_eaten || false,
        mealId: meal.id,
      })),
    })),
    isCurrent: plan.is_current,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  };
}

function transformDietDay(day: any): DietDay {
  return {
    date: day.date,
    planId: day.plan_id,
    meals: (day.meals || []).map((meal: any) => ({
      id: meal.id,
      name: meal.name,
      time: meal.time,
      items: (meal.items || []).map((item: any) => ({
        id: item.id,
        foodId: item.food_id,
        food: transformFoodItem(item.food),
        plannedQuantity: item.planned_quantity,
        actualQuantity: item.actual_quantity,
        isEaten: item.is_eaten || false,
        mealId: item.meal_id,
      })),
    })),
    adHocItems: (day.ad_hoc_items || []).map((item: any) => ({
      id: item.id,
      foodId: item.food_id,
      food: transformFoodItem(item.food),
      plannedQuantity: item.quantity,
      actualQuantity: item.quantity,
      isEaten: true,
      mealId: '',
    })),
    totals: {
      planned: day.totals?.planned || { calories: 0, protein: 0, carbs: 0, fat: 0 },
      actual: day.totals?.actual || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    },
    adherence: day.adherence || 0,
  };
}

function transformFoodLog(log: any): FoodLog {
  return {
    id: log.id,
    userId: log.user_id,
    foodId: log.food_id,
    food: transformFoodItem(log.food),
    quantity: log.quantity,
    date: log.date,
    mealId: log.meal_id,
    createdAt: log.created_at,
  };
}

export const dietApi = {
  async getToday(date: string): Promise<DietDay> {
    const response = await apiClient.get<any>(`/days/${date}/diet`);
    return transformDietDay(response);
  },

  async logItem(data: LogDietItemRequest): Promise<FoodLog> {
    const response = await apiClient.post<any>('/food-logs', data);
    return transformFoodLog(response);
  },

  async updateItemQuantity(logId: string, quantity: number): Promise<void> {
    await apiClient.patch(`/food-logs/${logId}`, { quantity });
  },

  async toggleItemEaten(logId: string, isEaten: boolean): Promise<void> {
    await apiClient.patch(`/food-logs/${logId}`, { is_eaten: isEaten });
  },

  async getPlans(): Promise<DietPlan[]> {
    const response = await apiClient.get<any[]>('/diet-plans');
    return response.map(transformDietPlan);
  },

  async createPlan(data: CreateDietPlanRequest): Promise<DietPlan> {
    const response = await apiClient.post<any>('/diet-plans', data);
    return transformDietPlan(response);
  },

  async updatePlan(planId: string, data: Partial<CreateDietPlanRequest>): Promise<DietPlan> {
    const response = await apiClient.put<any>(`/diet-plans/${planId}`, data);
    return transformDietPlan(response);
  },

  async searchFoods(query: string): Promise<FoodItem[]> {
    const response = await apiClient.get<any[]>('/food-items/search', { q: query });
    return response.map(transformFoodItem);
  },
};
