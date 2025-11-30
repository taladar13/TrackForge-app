// File: src/utils/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { OfflineQueueItem } from '../types';

const STORAGE_KEYS = {
  AUTH_TOKENS: 'trackforge_auth_tokens',
  USER_ID: 'trackforge_user_id',
  OFFLINE_QUEUE: '@trackforge/offline_queue', // AsyncStorage allows @ and /
} as const;

export const storage = {
  // Auth - Using SecureStore for sensitive data
  async getAuthTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKENS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting auth tokens:', error);
      return null;
    }
  },

  async setAuthTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error setting auth tokens:', error);
      throw error;
    }
  },

  async clearAuthTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKENS);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ID);
    } catch (error) {
      // Ignore errors when deleting
      console.error('Error clearing auth tokens:', error);
    }
  },

  async getUserId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },

  async setUserId(userId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Error setting user ID:', error);
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

