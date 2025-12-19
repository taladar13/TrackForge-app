// File: App.tsx

import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { enableScreens } from 'react-native-screens';

// Import directly to avoid potential circular dependency issues
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { offlineQueueService } from './src/services/offlineQueue';
import { useOfflineStore } from './src/store/offlineStore';

// Disable native screens to avoid Fabric crashes while debugging
enableScreens(false);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const isOnline = state.isConnected ?? false;
    setOnline(isOnline);
    useOfflineStore.setState({ isOnline });
  });

  return () => unsubscribe();
});

focusManager.setEventListener((handleFocus) => {
  const onAppStateChange = (status: AppStateStatus) => {
    handleFocus(status === 'active');
  };

  const subscription = AppState.addEventListener('change', onAppStateChange);
  return () => subscription.remove();
});

// Component to handle offline sync
const OfflineSyncHandler: React.FC = () => {
  const isOnline = useOfflineStore((state) => state.isOnline);

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      const initialOnline = state.isConnected ?? false;
      onlineManager.setOnline(initialOnline);
      useOfflineStore.setState({ isOnline: initialOnline });
      offlineQueueService.getQueue().then((queue) => {
        useOfflineStore.setState({ pendingSyncCount: queue.length });
      });

      if (initialOnline) {
        offlineQueueService.syncQueue();
      }
    });
  }, []);

  useEffect(() => {
    if (isOnline) {
      offlineQueueService.syncQueue();
    }
  }, [isOnline]);

  return null;
};

// Simple fallback component in case of errors
const ErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <View style={fallbackStyles.container}>
    <Text style={fallbackStyles.title}>Something went wrong</Text>
    <Text style={fallbackStyles.message}>{error.message}</Text>
    <Text style={fallbackStyles.button} onPress={resetError}>
      Try Again
    </Text>
  </View>
);

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default function App() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <OfflineSyncHandler />
        <RootNavigator />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
