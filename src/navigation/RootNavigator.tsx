// File: src/navigation/RootNavigator.tsx

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoadingSpinner } from '../components';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { storage } from '../utils/storage';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/endpoints/auth';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const tokens = await storage.getAuthTokens();
        if (tokens) {
          try {
            const currentUser = await authApi.getMe();
            setUser(currentUser);
          } catch (error) {
            console.warn('Unable to fetch current user, clearing auth state.', error);
            await storage.clearAuthTokens();
            setUser(null);
          }
          return;
        }

        // No tokens stored, ensure state reflects logged out
        setUser(null);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setUser]);

  if (isLoading) {
    return <LoadingSpinner fullScreen={true} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

