// File: src/utils/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

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
  async getOfflineQueue(): Promise<any[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  },

  async addToOfflineQueue(item: any): Promise<void> {
    const queue = await storage.getOfflineQueue();
    queue.push(item);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  async removeFromOfflineQueue(itemId: string): Promise<void> {
    const queue = await storage.getOfflineQueue();
    const filtered = queue.filter((item: any) => item.id !== itemId);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
  },

  async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  },
};

