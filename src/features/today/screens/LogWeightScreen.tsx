// File: src/features/today/screens/LogWeightScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { Input, Button } from '../../../components';
import { colors, spacing } from '../../../theme';
import { useLogWeight } from '../../../api/hooks';

interface FormData {
  weight: string;
}

export const LogWeightScreen: React.FC = () => {
  const navigation = useNavigation();
  const [date] = useState(new Date());
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>();
  const logWeightMutation = useLogWeight();

  const onSubmit = async (data: FormData) => {
    try {
      await logWeightMutation.mutateAsync({
        date: format(date, 'yyyy-MM-dd'),
        weight: parseFloat(data.weight),
      });
      navigation.goBack();
    } catch (error) {
      // Error handled by React Query
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Controller
          control={control}
          name="weight"
          rules={{
            required: 'Weight is required',
            pattern: {
              value: /^\d+(\.\d+)?$/,
              message: 'Please enter a valid number',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Weight (kg)"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              error={errors.weight?.message}
              placeholder="Enter weight"
            />
          )}
        />
        <Button
          title="Save"
          onPress={handleSubmit(onSubmit)}
          loading={logWeightMutation.isPending}
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
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
  button: {
    marginTop: spacing.md,
  },
});

