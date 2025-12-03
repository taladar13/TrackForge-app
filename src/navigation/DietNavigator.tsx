// File: src/navigation/DietNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DietStackParamList } from './types';
import { DietTodayScreen } from '../features/diet/screens/DietTodayScreen';
import { DietPlansScreen } from '../features/diet/screens/DietPlansScreen';
import { DietPlanEditorScreen } from '../features/diet/screens/DietPlanEditorScreen';
import { FoodSearchScreen } from '../features/diet/screens/FoodSearchScreen';

const Stack = createNativeStackNavigator<DietStackParamList>();

export const DietNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DietToday" component={DietTodayScreen} options={{ title: 'Diet - Today' }} />
      <Stack.Screen name="DietPlans" component={DietPlansScreen} options={{ title: 'Diet Plans' }} />
      <Stack.Screen name="DietPlanEditor" component={DietPlanEditorScreen} options={{ title: 'Plan Editor' }} />
      <Stack.Screen name="FoodSearch" component={FoodSearchScreen} options={{ title: 'Search Food' }} />
    </Stack.Navigator>
  );
};

