// File: src/store/offlineStore.ts

import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  pendingSyncCount: number;
  setIsOnline: (isOnline: boolean) => void;
  setPendingSyncCount: (count: number) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: true,
  pendingSyncCount: 0,
  setIsOnline: (isOnline) => set({ isOnline }),
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
}));

