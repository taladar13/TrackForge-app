// File: src/features/workout/screens/WorkoutActiveScreen.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { Button } from '../../../components';
import { colors, spacing, typography, textStyles } from '../../../theme';
import { useTodayWorkout, useCreateWorkoutSession } from '../../../api/hooks';
import { offlineQueueService } from '../../../services/offlineQueue';
import { useOfflineStore } from '../../../store/offlineStore';
import { WorkoutSet, Exercise } from '../../../types';
import { calculateTotalVolume, calculate1RM } from '../../../utils/calculations';
import { WorkoutStackParamList } from '../../../navigation/types';

interface ExerciseState {
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
}

type WorkoutActiveScreenNavigationProp = NativeStackNavigationProp<WorkoutStackParamList, 'WorkoutActive'>;
type WorkoutActiveScreenRouteProp = RouteProp<WorkoutStackParamList, 'WorkoutActive'>;

export const WorkoutActiveScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutActiveScreenNavigationProp>();
  const route = useRoute<WorkoutActiveScreenRouteProp>();
  const workoutId = route.params?.workoutId;
  
  const { data: plannedWorkout } = useTodayWorkout(new Date());
  const createSessionMutation = useCreateWorkoutSession();
  const { isOnline } = useOfflineStore();
  
  const [startTime] = useState(new Date());
  const [exercises, setExercises] = useState<ExerciseState[]>([]);

  useEffect(() => {
    if (plannedWorkout) {
      const initialExercises: ExerciseState[] = plannedWorkout.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exercise: ex.exercise,
        sets: ex.sets.map((set) => ({ ...set, completed: false })),
      }));
      setExercises(initialExercises);
    }
  }, [plannedWorkout]);

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
    newExercises[exerciseIndex].sets.push({
      id: `set_${Date.now()}`,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      completed: false,
    });
    setExercises(newExercises);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const newExercises = [...exercises];
    const set = newExercises[exerciseIndex].sets[setIndex];
    set[field] = parseFloat(value) || 0;
    setExercises(newExercises);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    const set = newExercises[exerciseIndex].sets[setIndex];
    set.completed = !set.completed;
    setExercises(newExercises);
  };

  const handleFinish = async () => {
    const endTime = new Date();
    const sessionData = {
      workoutId,
      name: plannedWorkout?.name || 'Ad-hoc Workout',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: format(startTime, "HH:mm:ss"),
      endTime: format(endTime, "HH:mm:ss"),
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets.filter((s) => s.completed).map((s) => ({
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
        })),
      })),
    };

    try {
      if (isOnline) {
        await createSessionMutation.mutateAsync(sessionData);
      } else {
        await offlineQueueService.addWorkoutSession(sessionData);
      }
      navigation.goBack();
    } catch (error) {
      // Error handling
    }
  };

  const totalVolume = useMemo(
    () => exercises.reduce((total, ex) => total + calculateTotalVolume(ex.sets), 0),
    [exercises]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Offline - Will sync when online</Text>
          </View>
        )}

        {exercises.map((exercise, exerciseIndex) => {
          const exerciseVolume = calculateTotalVolume(exercise.sets);
          const completedSets = exercise.sets.filter((s) => s.completed);
          const bestSet = completedSets.reduce(
            (best, set) => {
              const oneRM = calculate1RM(set.weight, set.reps);
              return oneRM > best.oneRM ? { set, oneRM } : best;
            },
            { set: null as any, oneRM: 0 }
          );

          return (
            <View key={exercise.exerciseId} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
              <Text style={styles.exerciseStats}>
                Volume: {exerciseVolume}kg • Sets: {completedSets.length}
                {bestSet.set && ` • Est. 1RM: ${bestSet.oneRM.toFixed(1)}kg`}
              </Text>

              {exercise.sets.map((set, setIndex) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setNumber}>{setIndex + 1}</Text>
                  <TextInput
                    style={styles.setInput}
                    value={set.weight.toString()}
                    onChangeText={(value) => updateSet(exerciseIndex, setIndex, 'weight', value)}
                    keyboardType="decimal-pad"
                    placeholder="Weight"
                  />
                  <TextInput
                    style={styles.setInput}
                    value={set.reps.toString()}
                    onChangeText={(value) => updateSet(exerciseIndex, setIndex, 'reps', value)}
                    keyboardType="number-pad"
                    placeholder="Reps"
                  />
                  <TouchableOpacity
                    style={[styles.checkbox, set.completed && styles.checkboxChecked]}
                    onPress={() => toggleSetComplete(exerciseIndex, setIndex)}
                  >
                    {set.completed && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => addSet(exerciseIndex)}
              >
                <Text style={styles.addSetText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.summary}>
          <Text style={styles.summaryText}>Total Volume: {totalVolume.toFixed(0)}kg</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Finish Workout"
          onPress={handleFinish}
          loading={createSessionMutation.isPending}
          size="lg"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  offlineBanner: {
    backgroundColor: colors.warning + '20',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  offlineText: {
    ...textStyles.bodySmall,
    color: colors.warning,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseName: {
    ...textStyles.h4,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  exerciseStats: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  setNumber: {
    ...textStyles.body,
    fontWeight: typography.fontWeight.bold,
    width: 30,
  },
  setInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
    ...textStyles.body,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  addSetButton: {
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  addSetText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  summary: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryText: {
    ...textStyles.h4,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

