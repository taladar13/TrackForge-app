// File: src/services/offlineQueue.ts

import { storage } from '../utils/storage';
import { workoutApi, CreateWorkoutSessionRequest } from '../api/endpoints/workout';
import { WorkoutSession, OfflineQueueItem } from '../types';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from '../store/offlineStore';

const OFFLINE_QUEUE_KEY = '@trackforge/offline_queue';

class OfflineQueueService {
  async addWorkoutSession(sessionData: Partial<WorkoutSession>): Promise<string> {
    const queue = await this.getQueue();
    const item: OfflineQueueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'workout_session',
      data: sessionData as any,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    const nextQueue = [...queue, item];
    await storage.setOfflineQueue(nextQueue);
    useOfflineStore.setState({ pendingSyncCount: nextQueue.length });
    return item.id;
  }

  async getQueue(): Promise<OfflineQueueItem[]> {
    return await storage.getOfflineQueue();
  }

  async removeItem(itemId: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((item) => item.id !== itemId);
    await storage.setOfflineQueue(filtered);
    useOfflineStore.setState({ pendingSyncCount: filtered.length });
  }

  async clearQueue(): Promise<void> {
    await storage.clearOfflineQueue();
    useOfflineStore.setState({ pendingSyncCount: 0 });
  }

  async syncQueue(): Promise<{ synced: number; failed: number }> {
    const isConnected = (await NetInfo.fetch()).isConnected;
    if (!isConnected) {
      return { synced: 0, failed: 0 };
    }

    const queue = await this.getQueue();
    let workingQueue: OfflineQueueItem[] = [...queue];
    let synced = 0;
    let failed = 0;
    let queueChanged = false;

    for (const item of queue) {
      if (item.type === 'workout_session') {
        try {
          await workoutApi.createSession(item.data as CreateWorkoutSessionRequest);
          workingQueue = workingQueue.filter((q) => q.id !== item.id);
          queueChanged = true;
          synced++;
        } catch (error) {
          // Increment retry count
          item.retries = (item.retries || 0) + 1;
          failed++;

          // Remove if too many retries
          if (item.retries >= 3) {
            workingQueue = workingQueue.filter((q) => q.id !== item.id);
          } else {
            const itemIndex = workingQueue.findIndex((q) => q.id === item.id);
            if (itemIndex !== -1) {
              workingQueue[itemIndex] = { ...item };
            }
          }
          queueChanged = true;
        }
      }
    }

    if (queueChanged) {
      await storage.setOfflineQueue(workingQueue);
      useOfflineStore.setState({ pendingSyncCount: workingQueue.length });
    }

    return { synced, failed };
  }

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }
}

export const offlineQueueService = new OfflineQueueService();
