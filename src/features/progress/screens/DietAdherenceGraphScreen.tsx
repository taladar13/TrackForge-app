// File: src/features/progress/screens/DietAdherenceGraphScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { VictoryArea, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { Card } from '../../../components';
import { colors, spacing, typography, textStyles } from '../../../theme';
import { useDietAdherence } from '../../../api/hooks';
import { getAdherenceStatus } from '../../../utils/calculations';

export const DietAdherenceGraphScreen: React.FC = () => {
  const [fromDate] = useState(subDays(new Date(), 30));
  const { data: adherenceData, isLoading } = useDietAdherence(fromDate, new Date());

  if (isLoading || !adherenceData) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Calendar view - last 4 weeks
  const weeks = [];
  const startWeek = startOfWeek(subDays(new Date(), 21));
  const days = eachDayOfInterval({
    start: startWeek,
    end: new Date(),
  });

  const dayMap = new Map(adherenceData.map((item: any) => [item.date, item]));

  // Chart data
  const chartData = adherenceData.map((item: any) => ({
    x: new Date(item.date),
    y: item.calories,
  }));

  const chartDataProtein = adherenceData.map((item: any) => ({
    x: new Date(item.date),
    y: item.protein,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Weekly calendar */}
      <Card style={styles.calendarCard}>
        <Text style={styles.sectionTitle}>Weekly Calendar</Text>
        <View style={styles.calendarGrid}>
          {days.map((day: Date) => {
            const data = dayMap.get(format(day, 'yyyy-MM-dd')) as any;
            const status = data ? getAdherenceStatus(data.adherence) : 'none';
            const statusColor =
              status === 'green'
                ? colors.adherenceGreen
                : status === 'yellow'
                ? colors.adherenceYellow
                : status === 'red'
                ? colors.adherenceRed
                : colors.border;

            return (
              <View
                key={day.toISOString()}
                style={[
                  styles.calendarDay,
                  { backgroundColor: statusColor + '40', borderColor: statusColor },
                ]}
              >
                <Text style={styles.calendarDayLabel}>
                  {format(day, 'E')}
                </Text>
                <Text style={styles.calendarDayDate}>{format(day, 'd')}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.adherenceGreen }]} />
            <Text style={styles.legendText}>90-110%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.adherenceYellow }]} />
            <Text style={styles.legendText}>80-120%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.adherenceRed }]} />
            <Text style={styles.legendText}>Other</Text>
          </View>
        </View>
      </Card>

      {/* Calories chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Calories Trend</Text>
        <VictoryChart
          theme={VictoryTheme.material}
          height={200}
          padding={{ left: 60, top: 20, right: 20, bottom: 40 }}
        >
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: colors.border },
              tickLabels: { fill: colors.textSecondary },
            }}
          />
          <VictoryAxis
            tickFormat={(t: any) => format(new Date(t), 'MMM d')}
            style={{
              axis: { stroke: colors.border },
              tickLabels: { fill: colors.textSecondary },
            }}
          />
          <VictoryArea
            data={chartData}
            style={{
              data: { fill: colors.primary + '40', stroke: colors.primary },
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
  calendarCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...textStyles.h4,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  calendarDay: {
    width: '13%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  calendarDayDate: {
    ...textStyles.bodySmall,
    fontWeight: typography.fontWeight.semibold,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginRight: spacing.xs,
  },
  legendText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  chartCard: {
    padding: 0,
  },
});

