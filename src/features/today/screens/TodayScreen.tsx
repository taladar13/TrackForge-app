// File: src/features/today/screens/TodayScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, subDays, addDays } from 'date-fns';
import { TodayStackParamList } from '../../../navigation/types';
import { Card } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useTodayDiet } from '../../../api/hooks';
import { useTodayWorkout } from '../../../api/hooks';
import { useWeight } from '../../../api/hooks';
import { subMonths } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<TodayStackParamList>;

export const TodayScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { data: dietData, isLoading: dietLoading } = useTodayDiet(selectedDate);
  const { data: workoutData, isLoading: workoutLoading } = useTodayWorkout(selectedDate);
  
  // Get last 90 days of weight data to find most recent
  const { data: weightData } = useWeight(subMonths(selectedDate, 3), selectedDate);
  const lastWeight = weightData?.[weightData.length - 1];

  const handlePrevDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const caloriesProgress = dietData
    ? (dietData.totals.actual.calories / dietData.totals.planned.calories) * 100
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with date navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevDay} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{format(selectedDate, 'EEEE, MMM d')}</Text>
          <Text style={styles.yearText}>{format(selectedDate, 'yyyy')}</Text>
        </View>
        <TouchableOpacity onPress={handleNextDay} style={styles.navButton}>
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Diet Card */}
      <Card
        onPress={() => navigation.navigate('Diet', { screen: 'DietToday' })}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Diet</Text>
        {dietLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : dietData ? (
          <View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Calories</Text>
              <Text style={styles.progressValue}>
                {Math.round(dietData.totals.actual.calories)} / {Math.round(dietData.totals.planned.calories)} kcal
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, caloriesProgress)}%` },
                ]}
              />
            </View>
            <View style={styles.macroRow}>
              <Text style={styles.macroText}>
                P: {Math.round(dietData.totals.actual.protein)}g
              </Text>
              <Text style={styles.macroText}>
                C: {Math.round(dietData.totals.actual.carbs)}g
              </Text>
              <Text style={styles.macroText}>
                F: {Math.round(dietData.totals.actual.fat)}g
              </Text>
            </View>
            <Text style={styles.adherenceText}>
              Adherence: {dietData.adherence}%
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No diet plan for today</Text>
        )}
      </Card>

      {/* Workout Card */}
      <Card
        onPress={() => navigation.navigate('Workout', { screen: 'WorkoutToday' })}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Workout</Text>
        {workoutLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : workoutData ? (
          <View>
            <Text style={styles.workoutName}>{workoutData.name}</Text>
            <Text style={styles.workoutDetails}>
              {workoutData.exercises.length} exercises planned
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No workout planned for today</Text>
        )}
      </Card>

      {/* Weight Card */}
      <Card
        onPress={() => navigation.navigate('LogWeight')}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Weight</Text>
        {lastWeight ? (
          <View>
            <Text style={styles.weightValue}>
              {lastWeight.weight?.toFixed(1)} kg
            </Text>
            <Text style={styles.weightDate}>
              {format(new Date(lastWeight.date), 'MMM d, yyyy')}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No weight logged</Text>
        )}
        <TouchableOpacity style={styles.logButton}>
          <Text style={styles.logButtonText}>Log Weight</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
  },
  navButtonText: {
    ...typography.h4,
    color: colors.primary,
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateText: {
    ...typography.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  yearText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h4,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    color: colors.text,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressValue: {
    ...typography.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  macroText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  adherenceText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  workoutName: {
    ...typography.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  workoutDetails: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  weightValue: {
    ...typography.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  weightDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  logButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});

