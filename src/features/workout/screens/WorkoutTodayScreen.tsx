
// File: src/features/workout/screens/WorkoutTodayScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { Card, Button } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useTodayWorkout } from '../../../api/hooks';
import { useOfflineStore } from '../../../store/offlineStore';
import { offlineQueueService } from '../../../services/offlineQueue';

export const WorkoutTodayScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedDate] = useState(new Date());
  const { data: workoutData, isLoading } = useTodayWorkout(selectedDate);
  const { isOnline, pendingSyncCount } = useOfflineStore();

  useEffect(() => {
    // Check online status periodically
    const checkOnline = async () => {
      const online = await offlineQueueService.isOnline();
      useOfflineStore.setState({ isOnline: online });
      
      const queue = await offlineQueueService.getQueue();
      useOfflineStore.setState({ pendingSyncCount: queue.length });
    };

    checkOnline();
    const interval = setInterval(checkOnline, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Offline Status */}
      {!isOnline && (
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>
            ⚠️ Offline - Workouts will sync when connection is restored
          </Text>
          {pendingSyncCount > 0 && (
            <Text style={styles.statusSubtext}>
              {pendingSyncCount} workout(s) pending sync
            </Text>
          )}
        </Card>
      )}

      {workoutData ? (
        <Card style={styles.workoutCard}>
          <Text style={styles.workoutTitle}>{workoutData.name}</Text>
          <Text style={styles.workoutDetails}>
            {workoutData.exercises.length} exercises planned
          </Text>
          {workoutData.estimatedDuration && (
            <Text style={styles.workoutDuration}>
              ~{workoutData.estimatedDuration} minutes
            </Text>
          )}
          <Button
            title="Start Workout"
            onPress={() =>
              navigation.navigate('Workout' as any, {
                screen: 'WorkoutActive',
                params: { workoutId: workoutData.id },
              })
            }
            style={styles.startButton}
          />
        </Card>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No workout planned for today</Text>
          <Button
            title="Start Ad-Hoc Workout"
            onPress={() =>
              navigation.navigate('Workout' as any, {
                screen: 'WorkoutActive',
              })
            }
            variant="outline"
            style={styles.startButton}
          />
        </Card>
      )}
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
  statusCard: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning,
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
  statusSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  workoutCard: {
    marginBottom: spacing.md,
  },
  workoutTitle: {
    ...typography.h3,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  workoutDetails: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  workoutDuration: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  startButton: {
    marginTop: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

