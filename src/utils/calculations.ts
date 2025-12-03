// File: src/utils/calculations.ts

import { WorkoutSet, MacroTotals } from '../types';

/**
 * Calculate 1RM using Epley formula: weight × (1 + reps/30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 0 || weight === 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Calculate total volume for sets
 */
export function calculateTotalVolume(sets: WorkoutSet[]): number {
  return sets
    .filter(set => set.completed)
    .reduce((total, set) => total + set.weight * set.reps, 0);
}

/**
 * Calculate diet adherence percentage
 */
export function calculateDietAdherence(
  actual: MacroTotals,
  planned: MacroTotals
): number {
  const calorieDeviation = Math.abs((actual.calories - planned.calories) / planned.calories);
  const proteinDeviation = Math.abs((actual.protein - planned.protein) / planned.protein);
  const carbsDeviation = Math.abs((actual.carbs - planned.carbs) / planned.carbs);
  const fatDeviation = Math.abs((actual.fat - planned.fat) / planned.fat);

  const avgDeviation = (calorieDeviation + proteinDeviation + carbsDeviation + fatDeviation) / 4;
  
  // Convert deviation to adherence (100% = perfect match)
  const adherence = Math.max(0, Math.min(100, (1 - avgDeviation) * 100));
  return Math.round(adherence);
}

/**
 * Get adherence status color
 */
export function getAdherenceStatus(adherence: number): 'green' | 'yellow' | 'red' {
  if (adherence >= 90 && adherence <= 110) return 'green';
  if (adherence >= 80 && adherence <= 120) return 'yellow';
  return 'red';
}

