// File: src/features/progress/screens/ProgressHomeScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../../components';
import { colors, spacing, typography, textStyles } from '../../../theme';

export const ProgressHomeScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card
        onPress={() => navigation.navigate('Progress' as any, { screen: 'WeightGraph' })}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Weight Trend</Text>
        <Text style={styles.cardDescription}>
          Track your weight over time with detailed graphs
        </Text>
        <Text style={styles.cardArrow}>→</Text>
      </Card>

      <Card
        onPress={() => navigation.navigate('Progress' as any, { screen: 'DietAdherenceGraph' })}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Diet Adherence</Text>
        <Text style={styles.cardDescription}>
          Weekly calendar view and trends for calorie and macro adherence
        </Text>
        <Text style={styles.cardArrow}>→</Text>
      </Card>

      <Card
        onPress={() => navigation.navigate('Progress' as any, { screen: 'TrainingVolumeGraph' })}
        style={styles.card}
      >
        <Text style={styles.cardTitle}>Training Volume</Text>
        <Text style={styles.cardDescription}>
          Total volume per muscle group and exercise trends
        </Text>
        <Text style={styles.cardArrow}>→</Text>
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
  card: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...textStyles.h4,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  cardArrow: {
    ...textStyles.h3,
    color: colors.primary,
    marginLeft: spacing.md,
  },
});

