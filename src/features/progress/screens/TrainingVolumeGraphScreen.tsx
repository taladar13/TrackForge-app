// File: src/features/progress/screens/TrainingVolumeGraphScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { format, subWeeks } from 'date-fns';
import { Card } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useTrainingVolume } from '../../../api/hooks';

export const TrainingVolumeGraphScreen: React.FC = () => {
  const [fromDate] = useState(subWeeks(new Date(), 8));
  const { data: volumeData, isLoading } = useTrainingVolume(fromDate, new Date());

  if (isLoading || !volumeData || volumeData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          {isLoading ? 'Loading...' : 'No training volume data available'}
        </Text>
      </View>
    );
  }

  // Aggregate by week
  const weeklyData = volumeData.reduce((acc, item) => {
    const week = format(new Date(item.date), 'yyyy-ww');
    if (!acc[week]) {
      acc[week] = { week, volume: 0 };
    }
    acc[week].volume += item.totalVolume;
    return acc;
  }, {} as Record<string, { week: string; volume: number }>);

  const chartData = Object.values(weeklyData).map((item, index) => ({
    x: `Week ${index + 1}`,
    y: item.volume,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Weekly Training Volume</Text>
        <VictoryChart
          theme={VictoryTheme.material}
          height={300}
          padding={{ left: 60, top: 20, right: 20, bottom: 60 }}
        >
          <VictoryAxis
            dependentAxis
            tickFormat={(t) => `${(t / 1000).toFixed(0)}k kg`}
            style={{
              axis: { stroke: colors.border },
              tickLabels: { fill: colors.textSecondary },
            }}
          />
          <VictoryAxis
            style={{
              axis: { stroke: colors.border },
              tickLabels: { fill: colors.textSecondary },
            }}
          />
          <VictoryBar
            data={chartData}
            style={{
              data: { fill: colors.primary },
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
  chartCard: {
    padding: 0,
  },
  sectionTitle: {
    ...typography.h4,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

