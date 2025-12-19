// File: src/features/workout/screens/WorkoutProgramEditorScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Input, Button } from '../../../components';
import { colors, spacing, textStyles } from '../../../theme';
import { useWorkoutPrograms, useCreateWorkoutProgram, useUpdateWorkoutProgram } from '../../../api/hooks';

// Simplified version - full implementation would include exercise selection and split configuration
export const WorkoutProgramEditorScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const programId = (route.params as any)?.programId;
  
  const { data: programs } = useWorkoutPrograms();
  const existingProgram = programs?.find((p) => p.id === programId);
  
  const createMutation = useCreateWorkoutProgram();
  const updateMutation = useUpdateWorkoutProgram();
  
  const [name, setName] = useState(existingProgram?.name || '');

  const handleSave = async () => {
    const programData = {
      name,
      frequency: existingProgram?.frequency || 4,
      split: existingProgram?.split || {},
      workouts: existingProgram?.workouts || {},
    };

    if (programId) {
      await updateMutation.mutateAsync({ programId, data: programData });
    } else {
      await createMutation.mutateAsync(programData);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label="Program Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g., PPL 4x/week"
      />
      
      <Text style={styles.note}>
        Full program editor with split configuration, exercise selection, and target sets/reps would be implemented here.
      </Text>

      <Button
        title={programId ? 'Update Program' : 'Create Program'}
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
  note: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});

