// File: src/api/endpoints/workout.ts

import { apiClient } from '../client';
import { Workout, WorkoutSession, WorkoutProgram, Exercise } from '../../types';

export interface CreateWorkoutSessionRequest {
  workoutId?: string;
  name: string;
  date: string;
  startTime?: string;
  endTime?: string;
  exercises: Array<{
    exerciseId: string;
    sets: Array<{
      weight: number;
      reps: number;
      rpe?: number;
    }>;
  }>;
}

export interface CreateWorkoutProgramRequest {
  name: string;
  frequency: number;
  split: { [dayOfWeek: number]: string };
  workouts: {
    [workoutName: string]: {
      name: string;
      exercises: Array<{
        exerciseId: string;
        targetSets: number;
        targetRepsMin?: number;
        targetRepsMax?: number;
        targetWeight?: number;
        order: number;
      }>;
    };
  };
}

export const workoutApi = {
  async getToday(date: string): Promise<Workout | null> {
    return await apiClient.get<Workout | null>('/workout/today', { date });
  },

  async createSession(data: CreateWorkoutSessionRequest): Promise<WorkoutSession> {
    return await apiClient.post<WorkoutSession>('/workout/sessions', data);
  },

  async getSessions(from: string, to: string): Promise<WorkoutSession[]> {
    return await apiClient.get<WorkoutSession[]>('/workout/sessions', { from, to });
  },

  async getSession(sessionId: string): Promise<WorkoutSession> {
    return await apiClient.get<WorkoutSession>(`/workout/sessions/${sessionId}`);
  },

  async getPrograms(): Promise<WorkoutProgram[]> {
    return await apiClient.get<WorkoutProgram[]>('/workout/programs');
  },

  async createProgram(data: CreateWorkoutProgramRequest): Promise<WorkoutProgram> {
    return await apiClient.post<WorkoutProgram>('/workout/programs', data);
  },

  async updateProgram(programId: string, data: Partial<CreateWorkoutProgramRequest>): Promise<WorkoutProgram> {
    return await apiClient.patch<WorkoutProgram>(`/workout/programs/${programId}`, data);
  },

  async searchExercises(query: string): Promise<Exercise[]> {
    return await apiClient.get<Exercise[]>('/exercises/search', { q: query });
  },
};

