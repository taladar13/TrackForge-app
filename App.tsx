// File: App.tsx

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { offlineQueueService } from './src/services/offlineQueue';
import { useOfflineStore } from './src/store/offlineStore';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

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
      offlineQueueService.syncQueue().then(({ synced }) => {
        if (synced > 0) {
          console.log(`Synced ${synced} offline items`);
        }
      });
    }
  }, [isOnline]);

  return null;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <OfflineSyncHandler />
      <RootNavigator />
    </QueryClientProvider>
  );
}

