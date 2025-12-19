// File: src/features/workout/screens/WorkoutProgramsScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../../../components';
import { colors, spacing, typography, textStyles } from '../../../theme';
import { useWorkoutPrograms } from '../../../api/hooks';
import { WorkoutProgram } from '../../../types';

export const WorkoutProgramsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data: programs, isLoading } = useWorkoutPrograms();

  const renderProgram = ({ item }: { item: WorkoutProgram }) => (
    <Card
      key={item.id}
      onPress={() =>
        navigation.navigate('Workout' as any, {
          screen: 'WorkoutProgramEditor',
          params: { programId: item.id },
        })
      }
      style={styles.programCard}
    >
      <View style={styles.programHeader}>
        <Text style={styles.programName}>{item.name}</Text>
        {item.isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.badgeText}>Current</Text>
          </View>
        )}
      </View>
      <Text style={styles.programDetails}>
        {item.frequency}x/week • {Object.keys(item.workouts).length} workouts
      </Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={programs || []}
        renderItem={renderProgram}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No workout programs yet</Text>
          ) : null
        }
      />
      <View style={styles.footer}>
        <Button
          title="Create New Program"
          onPress={() =>
            navigation.navigate('Workout' as any, {
              screen: 'WorkoutProgramEditor',
            })
          }
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
  listContent: {
    padding: spacing.md,
  },
  programCard: {
    marginBottom: spacing.md,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  programName: {
    ...textStyles.h4,
    fontWeight: typography.fontWeight.semibold,
  },
  currentBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  badgeText: {
    ...textStyles.caption,
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semibold,
  },
  programDetails: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

