// File: src/navigation/TodayNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TodayStackParamList } from './types';
import { TodayScreen } from '../features/today/screens/TodayScreen';
import { LogWeightScreen } from '../features/today/screens/LogWeightScreen';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export const TodayNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TodayHome"
        component={TodayScreen}
        options={{ title: 'Today' }}
      />
      <Stack.Screen
        name="LogWeight"
        component={LogWeightScreen}
        options={{ title: 'Log Weight' }}
      />
    </Stack.Navigator>
  );
};

