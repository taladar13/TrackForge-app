// File: src/utils/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueueItem } from '../types';

const STORAGE_KEYS = {
  AUTH_TOKENS: '@trackforge/auth_tokens',
  USER_ID: '@trackforge/user_id',
  OFFLINE_QUEUE: '@trackforge/offline_queue',
} as const;

export const storage = {
  // Auth
  async getAuthTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKENS);
    return data ? JSON.parse(data) : null;
  },

  async setAuthTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
  },

  async clearAuthTokens(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKENS);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);
  },

  async getUserId(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
  },

  async setUserId(userId: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
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

