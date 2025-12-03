// File: src/api/endpoints/progress.ts

import { apiClient } from '../client';
import { BodyMetric, DietAdherenceData, TrainingVolumeData } from '../../types';

export interface LogWeightRequest {
  date: string;
  weight: number;
}

export const progressApi = {
  async getWeight(from: string, to: string): Promise<BodyMetric[]> {
    return await apiClient.get<BodyMetric[]>('/progress/weight', { from, to });
  },

  async logWeight(data: LogWeightRequest): Promise<BodyMetric> {
    return await apiClient.post<BodyMetric>('/progress/weight', data);
  },

  async getDietAdherence(from: string, to: string): Promise<DietAdherenceData[]> {
    return await apiClient.get<DietAdherenceData[]>('/progress/diet-adherence', { from, to });
  },

  async getTrainingVolume(from: string, to: string): Promise<TrainingVolumeData[]> {
    return await apiClient.get<TrainingVolumeData[]>('/progress/training-volume', { from, to });
  },
};

