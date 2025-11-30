// File: src/store/authStore.ts

import { create } from 'zustand';
import { User, Profile } from '../types';

interface AuthState {
  user: (User & { profile?: Profile }) | null;
  isAuthenticated: boolean;
  setUser: (user: (User & { profile?: Profile }) | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

