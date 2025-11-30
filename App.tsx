// File: App.tsx

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { offlineQueueService } from './src/services/offlineQueue';
import { useOfflineStore } from './src/store/offlineStore';
import NetInfo from '@react-native-community/netinfo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Component to handle offline sync
const OfflineSyncHandler: React.FC = () => {
  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected ?? false;
      useOfflineStore.setState({ isOnline });

      // Sync queue when coming back online
      if (isOnline) {
        offlineQueueService.syncQueue().then(({ synced, failed }) => {
          if (synced > 0) {
            console.log(`Synced ${synced} offline items`);
          }
        });
      }
    });

    // Initial sync check
    NetInfo.fetch().then((state) => {
      const isOnline = state.isConnected ?? false;
      useOfflineStore.setState({ isOnline });
      
      if (isOnline) {
        offlineQueueService.syncQueue();
      }
    });

    // Periodic sync (every 30 seconds)
    const syncInterval = setInterval(() => {
      NetInfo.fetch().then((state) => {
        if (state.isConnected) {
          offlineQueueService.syncQueue();
        }
      });
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
    };
  }, []);

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

