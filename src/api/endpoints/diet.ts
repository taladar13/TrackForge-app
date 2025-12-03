// File: src/api/endpoints/diet.ts

import { apiClient } from '../client';
import { DietDay, DietPlan, FoodItem, FoodLog } from '../../types';

export interface LogDietItemRequest {
  mealId?: string;
  foodId: string;
  quantity: number;
  date: string;
  isAdHoc?: boolean;
}

export interface CreateDietPlanRequest {
  name: string;
  daysOfWeek: number[];
  meals: Array<{
    name: string;
    time?: string;
    items: Array<{
      foodId: string;
      plannedQuantity: number;
    }>;
  }>;
}

export const dietApi = {
  async getToday(date: string): Promise<DietDay> {
    return await apiClient.get<DietDay>('/diet/today', { date });
  },

  async logItem(data: LogDietItemRequest): Promise<FoodLog> {
    return await apiClient.patch<FoodLog>('/diet/log', data);
  },

  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    return await apiClient.patch(`/diet/items/${itemId}`, { quantity });
  },

  async toggleItemEaten(itemId: string, isEaten: boolean): Promise<void> {
    return await apiClient.patch(`/diet/items/${itemId}`, { isEaten });
  },

  async getPlans(): Promise<DietPlan[]> {
    return await apiClient.get<DietPlan[]>('/diet/plans');
  },

  async createPlan(data: CreateDietPlanRequest): Promise<DietPlan> {
    return await apiClient.post<DietPlan>('/diet/plans', data);
  },

  async updatePlan(planId: string, data: Partial<CreateDietPlanRequest>): Promise<DietPlan> {
    return await apiClient.patch<DietPlan>(`/diet/plans/${planId}`, data);
  },

  async searchFoods(query: string): Promise<FoodItem[]> {
    return await apiClient.get<FoodItem[]>('/foods/search', { q: query });
  },
};

