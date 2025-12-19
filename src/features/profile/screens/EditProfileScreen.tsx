// File: src/features/profile/screens/EditProfileScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input, Button } from '../../../components';
import { colors, spacing, typography, textStyles } from '../../../theme';
import { useMe } from '../../../api/hooks';
import { Picker } from '@react-native-picker/picker';
import { Text } from 'react-native';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data: user } = useMe();
  const profile = user?.profile;

  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>(profile?.sex || 'male');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>(profile?.goal || 'maintain');

  const handleSave = async () => {
    // Would use useUpdateProfile hook here
    // await updateProfileMutation.mutateAsync({ age, height, weight, sex, goal });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        placeholder="Enter your age"
      />

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

      <Button title="Save" onPress={handleSave} style={styles.button} />
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
  pickerContainer: {
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  pickerLabel: {
    ...textStyles.bodySmall,
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

