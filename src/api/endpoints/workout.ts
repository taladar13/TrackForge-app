// File: src/api/endpoints/workout.ts

import { apiClient } from '../client';
import { Workout, WorkoutSession, WorkoutProgram, Exercise } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateWorkoutSessionRequest {
  id: string; // Client-generated UUID
  workout_name: string;
  date: string;
  program_id?: string;
  start_time?: string;
  end_time?: string;
  sets: Array<{
    id: string; // Client-generated UUID
    exercise_id: string;
    set_number: number;
    weight: number;
    reps: number;
    rpe?: number;
    completed?: boolean;
  }>;
}

export interface CreateWorkoutProgramRequest {
  name: string;
  frequency: number;
  split: { [dayOfWeek: number]: string };
  workouts: {
    [workoutName: string]: {
      workout_name: string;
      exercises: Array<{
        exercise_id: string;
        target_sets: number;
        target_reps_min?: number;
        target_reps_max?: number;
        target_weight?: number;
        order: number;
      }>;
    };
  };
}

// Transform snake_case to camelCase
function transformExercise(ex: any): Exercise {
  return {
    id: ex.id,
    name: ex.name,
    equipmentType: ex.equipment_type,
    muscleGroup: ex.muscle_groups,
    category: ex.category,
  };
}

function transformWorkoutSession(session: any): WorkoutSession {
  const exercises: { [exerciseId: string]: any[] } = {};
  
  // Group sets by exercise
  for (const set of session.sets || []) {
    if (!exercises[set.exercise_id]) {
      exercises[set.exercise_id] = [];
    }
    exercises[set.exercise_id].push({
      id: set.id,
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
      completed: set.completed,
    });
  }

  return {
    id: session.id,
    userId: session.user_id,
    workoutId: session.program_id,
    name: session.workout_name,
    date: session.date,
    startTime: session.start_time,
    endTime: session.end_time,
    exercises: Object.entries(exercises).map(([exerciseId, sets]) => {
      const firstSet = (session.sets || []).find((s: any) => s.exercise_id === exerciseId);
      return {
        id: exerciseId,
        exerciseId: exerciseId,
        exercise: firstSet?.exercise ? transformExercise(firstSet.exercise) : {
          id: exerciseId,
          name: 'Unknown',
          category: 'strength',
        },
        sets: sets,
      };
    }),
    totals: {
      totalSets: session.totals?.total_sets || 0,
      totalVolume: session.totals?.total_volume || 0,
      duration: session.totals?.duration,
    },
    isSynced: true,
    createdAt: session.created_at,
  };
}

function transformWorkoutProgram(program: any): WorkoutProgram {
  const workouts: { [name: string]: Workout } = {};
  
  for (const day of program.days || []) {
    workouts[day.workout_name] = {
      id: day.id,
      name: day.workout_name,
      exercises: (day.exercises || []).map((ex: any, index: number) => ({
        id: `${day.id}-${index}`,
        exerciseId: ex.exercise_id,
        exercise: { id: ex.exercise_id, name: 'Exercise', category: 'strength' },
        targetSets: ex.target_sets,
        targetRepsMin: ex.target_reps_min,
        targetRepsMax: ex.target_reps_max,
        targetWeight: ex.target_weight,
        sets: [],
        order: ex.order,
      })),
      programId: program.id,
    };
  }

  return {
    id: program.id,
    name: program.name,
    userId: program.user_id,
    frequency: program.frequency,
    split: program.split,
    workouts: workouts,
    isCurrent: program.is_current,
    createdAt: program.created_at,
    updatedAt: program.updated_at,
  };
}

export const workoutApi = {
  async getToday(date: string): Promise<Workout | null> {
    try {
      const response = await apiClient.get<any>(`/days/${date}/workout`);
      if (!response.workout_name) {
        return null;
      }
      return {
        id: response.program_id || '',
        name: response.workout_name,
        exercises: (response.exercises || []).map((ex: any) => ({
          id: ex.exercise_id,
          exerciseId: ex.exercise_id,
          exercise: transformExercise(ex.exercise),
          targetSets: ex.target_sets,
          targetRepsMin: ex.target_reps_min,
          targetRepsMax: ex.target_reps_max,
          targetWeight: ex.target_weight,
          sets: [],
          order: ex.order,
        })),
        programId: response.program_id,
      };
    } catch (error) {
      return null;
    }
  },

  async createSession(data: Omit<CreateWorkoutSessionRequest, 'id'> & { id?: string }): Promise<WorkoutSession> {
    const sessionId = data.id || uuidv4();
    const idempotencyKey = uuidv4();
    
    const requestData: CreateWorkoutSessionRequest = {
      ...data,
      id: sessionId,
      sets: data.sets.map(set => ({
        ...set,
        id: set.id || uuidv4(),
      })),
    };

    const response = await apiClient.post<any>(
      '/workout-sessions',
      requestData,
      { idempotencyKey }
    );
    return transformWorkoutSession(response);
  },

  async getSessions(from: string, to: string): Promise<WorkoutSession[]> {
    const response = await apiClient.get<any>('/workout-sessions', { from, to });
    return (response.data || []).map(transformWorkoutSession);
  },

  async getSession(sessionId: string): Promise<WorkoutSession> {
    const response = await apiClient.get<any>(`/workout-sessions/${sessionId}`);
    return transformWorkoutSession(response);
  },

  async getPrograms(): Promise<WorkoutProgram[]> {
    const response = await apiClient.get<any[]>('/workout-programs');
    return response.map(transformWorkoutProgram);
  },

  async createProgram(data: CreateWorkoutProgramRequest): Promise<WorkoutProgram> {
    const response = await apiClient.post<any>('/workout-programs', data);
    return transformWorkoutProgram(response);
  },

  async updateProgram(programId: string, data: Partial<CreateWorkoutProgramRequest>): Promise<WorkoutProgram> {
    const response = await apiClient.put<any>(`/workout-programs/${programId}`, data);
    return transformWorkoutProgram(response);
  },

  async searchExercises(query: string): Promise<Exercise[]> {
    const response = await apiClient.get<any[]>('/exercises/search', { q: query });
    return response.map(transformExercise);
  },
};
