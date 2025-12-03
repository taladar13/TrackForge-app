// File: src/utils/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { OfflineQueueItem } from '../types';

const STORAGE_KEYS = {
  AUTH_TOKENS: 'trackforge_auth_tokens',
  USER_ID: 'trackforge_user_id',
  OFFLINE_QUEUE: '@trackforge/offline_queue', // AsyncStorage allows @ and /
} as const;

const FALLBACK_KEYS = {
  AUTH_TOKENS: 'trackforge_auth_tokens_fallback',
  USER_ID: 'trackforge_user_id_fallback',
} as const;

const secureStoreAvailable =
  typeof SecureStore.getItemAsync === 'function' &&
  typeof SecureStore.setItemAsync === 'function';

// SecureStore is only safe to use in release builds right now (Expo Go/Hermes throws native errors)
const shouldUseSecureStore = secureStoreAvailable && !__DEV__;

export const storage = {
  // Auth - Using SecureStore for sensitive data
  async getAuthTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    if (shouldUseSecureStore) {
      try {
        const data = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKENS);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error getting auth tokens from SecureStore:', error);
        // Fall through to the dev fallback
      }
    }

    try {
      const data = await AsyncStorage.getItem(FALLBACK_KEYS.AUTH_TOKENS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting fallback auth tokens:', error);
      return null;
    }
  },

  async setAuthTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    if (shouldUseSecureStore) {
      try {
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
        return;
      } catch (error) {
        console.error('Error setting auth tokens in SecureStore:', error);
        // Fall through to the dev fallback
      }
    }

    try {
      await AsyncStorage.setItem(FALLBACK_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error setting fallback auth tokens:', error);
      throw error;
    }
  },

  async clearAuthTokens(): Promise<void> {
    if (shouldUseSecureStore) {
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKENS);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ID);
      } catch (error) {
        console.error('Error clearing auth tokens from SecureStore:', error);
      }
    }

    try {
      await AsyncStorage.removeItem(FALLBACK_KEYS.AUTH_TOKENS);
      await AsyncStorage.removeItem(FALLBACK_KEYS.USER_ID);
    } catch (error) {
      console.error('Error clearing fallback auth tokens:', error);
    }
  },

  async getUserId(): Promise<string | null> {
    if (shouldUseSecureStore) {
      try {
        return await SecureStore.getItemAsync(STORAGE_KEYS.USER_ID);
      } catch (error) {
        console.error('Error getting user ID from SecureStore:', error);
      }
    }

    try {
      return await AsyncStorage.getItem(FALLBACK_KEYS.USER_ID);
    } catch (error) {
      console.error('Error getting fallback user ID:', error);
      return null;
    }
  },

  async setUserId(userId: string): Promise<void> {
    if (shouldUseSecureStore) {
      try {
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_ID, userId);
        return;
      } catch (error) {
        console.error('Error setting user ID in SecureStore:', error);
      }
    }

    try {
      await AsyncStorage.setItem(FALLBACK_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Error setting fallback user ID:', error);
      throw error;
    }
  },

  // Offline Queue
  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  },

  async setOfflineQueue(queue: OfflineQueueItem[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  },
};

