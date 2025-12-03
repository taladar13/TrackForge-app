// File: src/features/diet/screens/DietTodayScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { Card, Button } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useTodayDiet, useToggleDietItem } from '../../../api/hooks';

export const DietTodayScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedDate] = useState(new Date());
  const { data: dietData, isLoading } = useTodayDiet(selectedDate);
  const toggleItemMutation = useToggleDietItem();

  const handleToggleItem = async (itemId: string, currentState: boolean) => {
    await toggleItemMutation.mutateAsync({
      itemId,
      isEaten: !currentState,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!dietData) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No diet plan for today</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Header */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Calories</Text>
            <Text style={styles.summaryValue}>
              {Math.round(dietData.totals.actual.calories)} / {Math.round(dietData.totals.planned.calories)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Protein</Text>
            <Text style={styles.summaryValue}>
              {Math.round(dietData.totals.actual.protein)}g
            </Text>
          </View>
        </View>
        <Text style={styles.adherenceText}>
          Adherence: {dietData.adherence}%
        </Text>
      </Card>

      {/* Meals */}
      {dietData.meals.map((meal) => (
        <Card key={meal.id} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealName}>{meal.name}</Text>
            {meal.time && (
              <Text style={styles.mealTime}>{meal.time}</Text>
            )}
          </View>
          {meal.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggleItem(item.id, item.isEaten)}
              >
                <View
                  style={[
                    styles.checkboxInner,
                    item.isEaten && styles.checkboxChecked,
                  ]}
                >
                  {item.isEaten && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.food.name}</Text>
                <Text style={styles.itemQuantity}>
                  {item.plannedQuantity}g planned
                  {item.actualQuantity && ` • ${item.actualQuantity}g eaten`}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      ))}

      {/* Add Off-Plan Food */}
      <Button
        title="Add Off-Plan Food"
        onPress={() => navigation.navigate('Diet' as any, {
          screen: 'FoodSearch',
          params: { date: format(selectedDate, 'yyyy-MM-dd') },
        })}
        variant="outline"
        style={styles.addButton}
      />
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
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.h4,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h4,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  adherenceText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  mealCard: {
    marginBottom: spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealName: {
    ...typography.h4,
    fontWeight: typography.fontWeight.semibold,
  },
  mealTime: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkbox: {
    marginRight: spacing.md,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  itemQuantity: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  addButton: {
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

