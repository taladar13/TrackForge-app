// File: src/api/endpoints/auth.ts

import { apiClient } from '../client';
import { User, AuthTokens, Profile } from '../../types';
import { storage } from '../../utils/storage';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    await storage.setAuthTokens(response.tokens);
    await storage.setUserId(response.user.id);
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    await storage.setAuthTokens(response.tokens);
    await storage.setUserId(response.user.id);
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await storage.clearAuthTokens();
    }
  },

  async getMe(): Promise<User & { profile: Profile }> {
    return await apiClient.get('/me');
  },
};

