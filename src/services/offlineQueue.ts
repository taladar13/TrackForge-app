// File: src/services/offlineQueue.ts

import { storage } from '../utils/storage';
import { workoutApi, CreateWorkoutSessionRequest } from '../api/endpoints/workout';
import { WorkoutSession, OfflineQueueItem } from '../types';
import NetInfo from '@react-native-community/netinfo';

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
    queue.push(item);
    await storage.addToOfflineQueue(item);
    return item.id;
  }

  async getQueue(): Promise<OfflineQueueItem[]> {
    return await storage.getOfflineQueue();
  }

  async removeItem(itemId: string): Promise<void> {
    await storage.removeFromOfflineQueue(itemId);
  }

  async clearQueue(): Promise<void> {
    await storage.clearOfflineQueue();
  }

  async syncQueue(): Promise<{ synced: number; failed: number }> {
    const isConnected = (await NetInfo.fetch()).isConnected;
    if (!isConnected) {
      return { synced: 0, failed: 0 };
    }

    const queue = await this.getQueue();
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      if (item.type === 'workout_session') {
        try {
          await workoutApi.createSession(item.data as CreateWorkoutSessionRequest);
          await this.removeItem(item.id);
          synced++;
        } catch (error) {
          // Increment retry count
          item.retries = (item.retries || 0) + 1;
          failed++;
          
          // Remove if too many retries
          if (item.retries >= 3) {
            await this.removeItem(item.id);
          } else {
            // Update queue with new retry count
            const updatedQueue = await this.getQueue();
            const itemIndex = updatedQueue.findIndex((q) => q.id === item.id);
            if (itemIndex !== -1) {
              updatedQueue[itemIndex] = item;
              await storage.clearOfflineQueue();
              for (const queueItem of updatedQueue) {
                await storage.addToOfflineQueue(queueItem);
              }
            }
          }
        }
      }
    }

    return { synced, failed };
  }

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }
}

export const offlineQueueService = new OfflineQueueService();
