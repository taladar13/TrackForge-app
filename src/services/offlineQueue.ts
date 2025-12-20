// File: src/services/offlineQueue.ts

import { v4 as uuidv4 } from 'uuid';
import { storage } from '../utils/storage';
import { workoutApi, CreateWorkoutSessionRequest } from '../api/endpoints/workout';
import { WorkoutSession, OfflineQueueItem } from '../types';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from '../store/offlineStore';

const OFFLINE_QUEUE_KEY = '@trackforge/offline_queue';

class OfflineQueueService {
  /**
   * Generate a stable client UUID for a workout session.
   * Uses proper UUID v4 for server compatibility.
   */
  generateSessionId(): string {
    return uuidv4();
  }

  /**
   * Generate a stable client UUID for a workout set.
   */
  generateSetId(): string {
    return uuidv4();
  }

  /**
   * Generate an idempotency key for a request.
   */
  generateIdempotencyKey(): string {
    return uuidv4();
  }

  async addWorkoutSession(sessionData: Partial<WorkoutSession>): Promise<string> {
    const queue = await this.getQueue();
    
    // Ensure session has a stable client UUID
    const sessionId = sessionData.id || this.generateSessionId();
    
    // Ensure all sets have stable client UUIDs
    const exercises = (sessionData.exercises || []).map(ex => ({
      ...ex,
      sets: (ex.sets || []).map(set => ({
        ...set,
        id: set.id || this.generateSetId(),
      })),
    }));

    const item: OfflineQueueItem = {
      id: sessionId, // Use session ID as queue item ID
      type: 'workout_session',
      data: {
        ...sessionData,
        id: sessionId,
        exercises,
      },
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
          const sessionData = item.data as Partial<WorkoutSession>;
          
          // Transform to API request format with client UUIDs
          const requestData: Omit<CreateWorkoutSessionRequest, 'id'> & { id: string } = {
            id: sessionData.id || item.id,
            workout_name: sessionData.name || 'Workout',
            date: sessionData.date || new Date().toISOString().split('T')[0],
            program_id: sessionData.workoutId,
            start_time: sessionData.startTime,
            end_time: sessionData.endTime,
            sets: (sessionData.exercises || []).flatMap((ex, exIndex) =>
              (ex.sets || []).map((set, setIndex) => ({
                id: set.id || this.generateSetId(),
                exercise_id: ex.exerciseId,
                set_number: setIndex + 1,
                weight: set.weight,
                reps: set.reps,
                rpe: set.rpe,
                completed: set.completed ?? true,
              }))
            ),
          };

          await workoutApi.createSession(requestData);
          workingQueue = workingQueue.filter((q) => q.id !== item.id);
          queueChanged = true;
          synced++;
        } catch (error: any) {
          // Increment retry count
          item.retries = (item.retries || 0) + 1;
          failed++;

          // Handle specific error cases
          const isConflict = error?.response?.status === 409;
          const isClientError = error?.response?.status >= 400 && error?.response?.status < 500;

          // Remove if conflict (already exists) or too many retries
          if (isConflict || item.retries >= 3) {
            if (!isConflict) {
              console.warn(
                `Failed to sync workout session after ${item.retries} attempts. Item ID: ${item.id}`,
                error
              );
            }
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
