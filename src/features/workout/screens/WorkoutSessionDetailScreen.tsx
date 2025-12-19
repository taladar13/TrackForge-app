// File: src/features/workout/screens/WorkoutSessionDetailScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { Card } from '../../../components';
import { colors, spacing, typography, textStyles } from '../../../theme';
import { useWorkoutSession } from '../../../api/hooks';
import { calculate1RM } from '../../../utils/calculations';

export const WorkoutSessionDetailScreen: React.FC = () => {
  const route = useRoute();
  const sessionId = (route.params as any)?.sessionId;
  const { data: session, isLoading } = useWorkoutSession(sessionId);

  if (isLoading || !session) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <Text style={styles.sessionName}>{session.name}</Text>
        <Text style={styles.sessionDate}>
          {format(new Date(session.date), 'EEEE, MMMM d, yyyy')}
        </Text>
        {session.startTime && session.endTime && (
          <Text style={styles.duration}>
            {session.startTime} - {session.endTime}
          </Text>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{session.totals.totalSets}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{session.totals.totalVolume.toFixed(0)}kg</Text>
          </View>
          {session.totals.duration && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{session.totals.duration}min</Text>
            </View>
          )}
        </View>
      </Card>

      {session.exercises.map((exerciseGroup) => {
        const best1RM = exerciseGroup.sets
          .filter((s) => s.completed)
          .reduce((best, set) => {
            const oneRM = calculate1RM(set.weight, set.reps);
            return oneRM > best ? oneRM : best;
          }, 0);

        return (
          <Card key={exerciseGroup.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{exerciseGroup.exercise.name}</Text>
            {best1RM > 0 && (
              <Text style={styles.oneRM}>Est. 1RM: {best1RM.toFixed(1)}kg</Text>
            )}
            {exerciseGroup.sets.map((set, index) => (
              <View key={index} style={styles.setRow}>
                <Text style={styles.setNumber}>{index + 1}</Text>
                <Text style={styles.setData}>
                  {set.weight}kg × {set.reps} reps
                  {set.rpe && ` @ RPE ${set.rpe}`}
                </Text>
              </View>
            ))}
          </Card>
        );
      })}
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
  headerCard: {
    marginBottom: spacing.md,
  },
  sessionName: {
    ...textStyles.h3,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  sessionDate: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  duration: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...textStyles.h4,
    fontWeight: typography.fontWeight.bold,
  },
  exerciseCard: {
    marginBottom: spacing.md,
  },
  exerciseName: {
    ...textStyles.h4,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  oneRM: {
    ...textStyles.bodySmall,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
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
  setData: {
    ...textStyles.body,
    color: colors.text,
  },
});

