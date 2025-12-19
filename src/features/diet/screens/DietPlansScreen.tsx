// File: src/features/diet/screens/DietPlansScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../../../components';
import { colors, spacing, typography, textStyles } from '../../../theme';
import { useDietPlans } from '../../../api/hooks';
import { DietPlan } from '../../../types';

export const DietPlansScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data: plans, isLoading } = useDietPlans();

  const renderPlanItem = ({ item }: { item: DietPlan }) => (
    <Card
      key={item.id}
      onPress={() =>
        navigation.navigate('Diet' as any, {
          screen: 'DietPlanEditor',
          params: { planId: item.id },
        })
      }
      style={styles.planCard}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{item.name}</Text>
        {item.isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </View>
      <Text style={styles.planDetails}>
        {item.meals.length} meals • {item.daysOfWeek.length} days/week
      </Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={plans || []}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No diet plans yet</Text>
          ) : null
        }
      />
      <View style={styles.footer}>
        <Button
          title="Create New Plan"
          onPress={() =>
            navigation.navigate('Diet' as any, {
              screen: 'DietPlanEditor',
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
  planCard: {
    marginBottom: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  planName: {
    ...textStyles.h4,
    fontWeight: typography.fontWeight.semibold,
  },
  currentBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  currentBadgeText: {
    ...textStyles.caption,
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semibold,
  },
  planDetails: {
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

