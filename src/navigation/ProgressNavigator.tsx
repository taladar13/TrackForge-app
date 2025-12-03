// File: src/navigation/ProgressNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProgressStackParamList } from './types';
import { ProgressHomeScreen } from '../features/progress/screens/ProgressHomeScreen';
import { WeightGraphScreen } from '../features/progress/screens/WeightGraphScreen';
import { DietAdherenceGraphScreen } from '../features/progress/screens/DietAdherenceGraphScreen';
import { TrainingVolumeGraphScreen } from '../features/progress/screens/TrainingVolumeGraphScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export const ProgressNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProgressHome" component={ProgressHomeScreen} options={{ title: 'Progress' }} />
      <Stack.Screen name="WeightGraph" component={WeightGraphScreen} options={{ title: 'Weight Trend' }} />
      <Stack.Screen name="DietAdherenceGraph" component={DietAdherenceGraphScreen} options={{ title: 'Diet Adherence' }} />
      <Stack.Screen name="TrainingVolumeGraph" component={TrainingVolumeGraphScreen} options={{ title: 'Training Volume' }} />
    </Stack.Navigator>
  );
};

