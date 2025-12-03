// File: src/features/diet/screens/DietPlanEditorScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Input, Button } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useDietPlans, useCreateDietPlan, useUpdateDietPlan } from '../../../api/hooks';
import { DietPlan } from '../../../types';

// Simplified version - full implementation would include meal/item editing
export const DietPlanEditorScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const planId = (route.params as any)?.planId;
  
  const { data: plans } = useDietPlans();
  const existingPlan = plans?.find((p) => p.id === planId);
  
  const createMutation = useCreateDietPlan();
  const updateMutation = useUpdateDietPlan();
  
  const [name, setName] = useState(existingPlan?.name || '');

  const handleSave = async () => {
    const planData = {
      name,
      daysOfWeek: existingPlan?.daysOfWeek || [1, 2, 3, 4, 5],
      meals: existingPlan?.meals || [],
    };

    if (planId) {
      await updateMutation.mutateAsync({ planId, data: planData });
    } else {
      await createMutation.mutateAsync(planData);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label="Plan Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g., Cut 2200 kcal"
      />
      
      <Text style={styles.sectionTitle}>Days of Week</Text>
      <Text style={styles.note}>
        Select which days this plan applies to (Mon-Fri by default)
      </Text>

      <Text style={styles.sectionTitle}>Meals</Text>
      <Text style={styles.note}>
        Add meals and food items. (Full meal editor UI would go here)
      </Text>

      <Text style={styles.note}>
        OCR Import: Coming soon (placeholder button would go here)
      </Text>

      <Button
        title={planId ? 'Update Plan' : 'Create Plan'}
        onPress={handleSave}
        loading={createMutation.isPending || updateMutation.isPending}
        style={styles.saveButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  note: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});

