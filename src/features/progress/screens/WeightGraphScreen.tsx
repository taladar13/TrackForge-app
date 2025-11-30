// File: src/features/progress/screens/WeightGraphScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { format, subDays } from 'date-fns';
import { Card } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useWeight } from '../../../api/hooks';

const TIME_RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export const WeightGraphScreen: React.FC = () => {
  const [rangeIndex, setRangeIndex] = useState(1); // Default to 30 days
  const range = TIME_RANGES[rangeIndex];
  const fromDate = subDays(new Date(), range.days);
  const { data: weightData, isLoading } = useWeight(fromDate, new Date());

  if (isLoading || !weightData || weightData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          {isLoading ? 'Loading...' : 'No weight data available'}
        </Text>
      </View>
    );
  }

  // Transform data for chart
  const chartData = weightData.map((item) => ({
    x: new Date(item.date),
    y: item.weight || 0,
  }));

  const latestWeight = weightData[weightData.length - 1]?.weight;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Time range selector */}
      <View style={styles.rangeSelector}>
        {TIME_RANGES.map((r, index) => (
          <TouchableOpacity
            key={r.label}
            style={[styles.rangeButton, index === rangeIndex && styles.rangeButtonActive]}
            onPress={() => setRangeIndex(index)}
          >
            <Text
              style={[
                styles.rangeButtonText,
                index === rangeIndex && styles.rangeButtonTextActive,
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Current weight card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Current Weight</Text>
        <Text style={styles.summaryValue}>{latestWeight?.toFixed(1)} kg</Text>
      </Card>

      {/* Chart */}
      <Card style={styles.chartCard}>
        <VictoryChart
          theme={VictoryTheme.material}
          height={250}
          padding={{ left: 60, top: 20, right: 20, bottom: 40 }}
        >
          <VictoryAxis
            dependentAxis
            tickFormat={(t) => `${t}kg`}
            style={{
              axis: { stroke: colors.border },
              tickLabels: { fill: colors.textSecondary },
            }}
          />
          <VictoryAxis
            tickFormat={(t) => format(new Date(t), 'MMM d')}
            style={{
              axis: { stroke: colors.border },
              tickLabels: { fill: colors.textSecondary },
            }}
          />
          <VictoryLine
            data={chartData}
            style={{
              data: { stroke: colors.primary, strokeWidth: 2 },
            }}
          />
        </VictoryChart>
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
  rangeSelector: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  rangeButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rangeButtonText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  rangeButtonTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeight.semibold,
  },
  summaryCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  chartCard: {
    padding: 0,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

