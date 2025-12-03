// File: src/features/profile/screens/OnboardingScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input, Button } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { Picker } from '@react-native-picker/picker';

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

  const handleContinue = () => {
    // Save profile data via API (would use useUpdateProfile hook)
    // Then navigate to main app
    navigation.navigate('Main' as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome to TrackForge!</Text>
      <Text style={styles.subtitle}>Let's set up your profile</Text>

      <Input
        label="Height (cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="decimal-pad"
        placeholder="Enter your height"
      />

      <Input
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="Enter your weight"
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Sex</Text>
        <Picker selectedValue={sex} onValueChange={(value) => setSex(value)}>
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Goal</Text>
        <Picker selectedValue={goal} onValueChange={(value) => setGoal(value)}>
          <Picker.Item label="Lose Weight" value="lose" />
          <Picker.Item label="Maintain Weight" value="maintain" />
          <Picker.Item label="Gain Weight" value="gain" />
        </Picker>
      </View>

      <Button
        title="Continue"
        onPress={handleContinue}
        style={styles.button}
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
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  pickerContainer: {
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  pickerLabel: {
    ...typography.bodySmall,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
  },
});

