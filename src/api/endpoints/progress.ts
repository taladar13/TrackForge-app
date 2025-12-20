// File: src/api/endpoints/progress.ts

import { apiClient } from '../client';
import { BodyMetric, DietAdherenceData, TrainingVolumeData } from '../../types';

export interface LogWeightRequest {
  date: string;
  weight: number;
  body_fat?: number;
  muscle_mass?: number;
}

// Transform snake_case to camelCase
function transformBodyMetric(metric: any): BodyMetric {
  return {
    id: metric.id,
    userId: metric.user_id,
    date: metric.date,
    weight: metric.weight,
    bodyFat: metric.body_fat,
    muscleMass: metric.muscle_mass,
    createdAt: metric.created_at,
  };
}

function transformDietAdherence(data: any): DietAdherenceData {
  return {
    date: data.date,
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    targetCalories: data.target_calories,
    adherence: data.adherence,
    status: data.status,
  };
}

function transformTrainingVolume(data: any): TrainingVolumeData {
  return {
    date: data.date,
    totalVolume: data.total_volume,
    volumeByMuscleGroup: data.volume_by_muscle_group || {},
    volumeByExercise: data.volume_by_exercise || {},
  };
}

export const progressApi = {
  async getWeight(from: string, to: string): Promise<BodyMetric[]> {
    const response = await apiClient.get<any[]>('/progress/weight', { from, to });
    return response.map(item => ({
      id: '',
      userId: '',
      date: item.date,
      weight: item.weight,
      createdAt: '',
    }));
  },

  async logWeight(data: LogWeightRequest): Promise<BodyMetric> {
    const response = await apiClient.post<any>('/body-metrics', data);
    return transformBodyMetric(response);
  },

  async getDietAdherence(from: string, to: string): Promise<DietAdherenceData[]> {
    const response = await apiClient.get<any[]>('/progress/diet-adherence', { from, to });
    return response.map(transformDietAdherence);
  },

  async getTrainingVolume(from: string, to: string): Promise<TrainingVolumeData[]> {
    const response = await apiClient.get<any[]>('/progress/training-volume', { from, to });
    return response.map(transformTrainingVolume);
  },
};
