// File: src/api/hooks/useDiet.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dietApi, LogDietItemRequest } from '../endpoints/diet';
import { format } from 'date-fns';

export const useTodayDiet = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['diet', 'today', dateStr],
    queryFn: () => dietApi.getToday(dateStr),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useLogDietItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LogDietItemRequest) => dietApi.logItem(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diet', 'today', variables.date] });
    },
  });
};

export const useUpdateDietItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      dietApi.updateItemQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet'] });
    },
  });
};

export const useToggleDietItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, isEaten }: { itemId: string; isEaten: boolean }) =>
      dietApi.toggleItemEaten(itemId, isEaten),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet'] });
    },
  });
};

export const useDietPlans = () => {
  return useQuery({
    queryKey: ['diet', 'plans'],
    queryFn: () => dietApi.getPlans(),
  });
};

export const useCreateDietPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dietApi.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet', 'plans'] });
    },
  });
};

export const useUpdateDietPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: any }) =>
      dietApi.updatePlan(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet', 'plans'] });
    },
  });
};

export const useSearchFoods = (query: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['foods', 'search', query],
    queryFn: () => dietApi.searchFoods(query),
    enabled: enabled && query.length > 2,
    staleTime: 5 * 60 * 1000,
  });
};

