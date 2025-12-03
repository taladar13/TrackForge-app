// File: src/navigation/MainNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { TodayNavigator } from './TodayNavigator';
import { DietNavigator } from './DietNavigator';
import { WorkoutNavigator } from './WorkoutNavigator';
import { ProgressNavigator } from './ProgressNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayNavigator}
        options={{
          tabBarLabel: 'Today',
        }}
      />
      <Tab.Screen
        name="Diet"
        component={DietNavigator}
        options={{
          tabBarLabel: 'Diet',
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutNavigator}
        options={{
          tabBarLabel: 'Workout',
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressNavigator}
        options={{
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

