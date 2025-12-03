// File: src/api/hooks/useWorkout.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workoutApi, CreateWorkoutSessionRequest } from '../endpoints/workout';
import { format } from 'date-fns';

export const useTodayWorkout = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['workout', 'today', dateStr],
    queryFn: () => workoutApi.getToday(dateStr),
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateWorkoutSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateWorkoutSessionRequest) => workoutApi.createSession(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'today', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['workout', 'sessions'] });
    },
  });
};

export const useWorkoutSessions = (from: Date, to: Date) => {
  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['workout', 'sessions', fromStr, toStr],
    queryFn: () => workoutApi.getSessions(fromStr, toStr),
  });
};

export const useWorkoutSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['workout', 'session', sessionId],
    queryFn: () => workoutApi.getSession(sessionId),
    enabled: !!sessionId,
  });
};

export const useWorkoutPrograms = () => {
  return useQuery({
    queryKey: ['workout', 'programs'],
    queryFn: () => workoutApi.getPrograms(),
  });
};

export const useCreateWorkoutProgram = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workoutApi.createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'programs'] });
    },
  });
};

export const useUpdateWorkoutProgram = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ programId, data }: { programId: string; data: any }) =>
      workoutApi.updateProgram(programId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'programs'] });
    },
  });
};

export const useSearchExercises = (query: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['exercises', 'search', query],
    queryFn: () => workoutApi.searchExercises(query),
    enabled: enabled && query.length > 2,
    staleTime: 5 * 60 * 1000,
  });
};

