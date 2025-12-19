// File: src/features/workout/screens/WorkoutHistoryScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format, subDays } from 'date-fns';
import { Card } from '../../../components';
import { colors, spacing, typography, textStyles } from '../../../theme';
import { useWorkoutSessions } from '../../../api/hooks';
import { WorkoutSession } from '../../../types';

export const WorkoutHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [fromDate] = useState(subDays(new Date(), 30));
  const [toDate] = useState(new Date());
  const { data: sessions, isLoading } = useWorkoutSessions(fromDate, toDate);

  const renderSession = ({ item }: { item: WorkoutSession }) => (
    <Card
      key={item.id}
      onPress={() =>
        navigation.navigate('Workout' as any, {
          screen: 'WorkoutSessionDetail',
          params: { sessionId: item.id },
        })
      }
      style={styles.sessionCard}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionName}>{item.name}</Text>
        <Text style={styles.sessionDate}>
          {format(new Date(item.date), 'MMM d, yyyy')}
        </Text>
      </View>
      <Text style={styles.sessionStats}>
        {item.totals.totalSets} sets • {item.totals.totalVolume.toFixed(0)}kg volume
      </Text>
      {!item.isSynced && (
        <Text style={styles.syncingText}>⏳ Syncing...</Text>
      )}
    </Card>
  );

  const groupedSessions = sessions?.reduce((acc, session) => {
    const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, WorkoutSession[]>) || {};

  const sections = Object.entries(groupedSessions).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, dateSessions] }) => (
          <View>
            <Text style={styles.sectionHeader}>
              {format(new Date(date), 'EEEE, MMMM d')}
            </Text>
            {dateSessions.map((session) => (
              <Card
                key={session.id}
                onPress={() =>
                  navigation.navigate('Workout' as any, {
                    screen: 'WorkoutSessionDetail',
                    params: { sessionId: session.id },
                  })
                }
                style={styles.sessionCard}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionName}>{session.name}</Text>
                </View>
                <Text style={styles.sessionStats}>
                  {session.totals.totalSets} sets • {session.totals.totalVolume.toFixed(0)}kg volume
                </Text>
                {!session.isSynced && (
                  <Text style={styles.syncingText}>⏳ Syncing...</Text>
                )}
              </Card>
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No workout sessions yet</Text>
          ) : null
        }
      />
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
  sectionHeader: {
    ...textStyles.h4,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  sessionCard: {
    marginBottom: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sessionName: {
    ...textStyles.body,
    fontWeight: typography.fontWeight.semibold,
  },
  sessionDate: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  sessionStats: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  syncingText: {
    ...textStyles.caption,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

