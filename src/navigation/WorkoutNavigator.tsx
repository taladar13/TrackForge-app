// File: src/navigation/WorkoutNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from './types';
import { WorkoutTodayScreen } from '../features/workout/screens/WorkoutTodayScreen';
import { WorkoutActiveScreen } from '../features/workout/screens/WorkoutActiveScreen';
import { WorkoutProgramsScreen } from '../features/workout/screens/WorkoutProgramsScreen';
import { WorkoutProgramEditorScreen } from '../features/workout/screens/WorkoutProgramEditorScreen';
import { WorkoutHistoryScreen } from '../features/workout/screens/WorkoutHistoryScreen';
import { WorkoutSessionDetailScreen } from '../features/workout/screens/WorkoutSessionDetailScreen';

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export const WorkoutNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WorkoutToday" component={WorkoutTodayScreen} options={{ title: 'Workout - Today' }} />
      <Stack.Screen name="WorkoutActive" component={WorkoutActiveScreen} options={{ title: 'Active Workout' }} />
      <Stack.Screen name="WorkoutPrograms" component={WorkoutProgramsScreen} options={{ title: 'Programs' }} />
      <Stack.Screen name="WorkoutProgramEditor" component={WorkoutProgramEditorScreen} options={{ title: 'Program Editor' }} />
      <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ title: 'History' }} />
      <Stack.Screen name="WorkoutSessionDetail" component={WorkoutSessionDetailScreen} options={{ title: 'Session Details' }} />
    </Stack.Navigator>
  );
};

