// File: src/api/hooks/useProgress.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { progressApi, LogWeightRequest } from '../endpoints/progress';
import { format } from 'date-fns';

export const useWeight = (from: Date, to: Date) => {
  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['progress', 'weight', fromStr, toStr],
    queryFn: () => progressApi.getWeight(fromStr, toStr),
  });
};

export const useLogWeight = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LogWeightRequest) => progressApi.logWeight(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress', 'weight'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
};

export const useDietAdherence = (from: Date, to: Date) => {
  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['progress', 'diet-adherence', fromStr, toStr],
    queryFn: () => progressApi.getDietAdherence(fromStr, toStr),
  });
};

export const useTrainingVolume = (from: Date, to: Date) => {
  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['progress', 'training-volume', fromStr, toStr],
    queryFn: () => progressApi.getTrainingVolume(fromStr, toStr),
  });
};

