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

// Transform snake_case response to camelCase
function transformAuthResponse(data: any): AuthResponse {
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
    },
    tokens: {
      accessToken: data.tokens.access_token,
      refreshToken: data.tokens.refresh_token,
    },
  };
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any>('/auth/login', credentials);
    const transformed = transformAuthResponse(response);
    await storage.setAuthTokens(transformed.tokens);
    await storage.setUserId(transformed.user.id);
    return transformed;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<any>('/auth/register', data);
    const transformed = transformAuthResponse(response);
    await storage.setAuthTokens(transformed.tokens);
    await storage.setUserId(transformed.user.id);
    return transformed;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await storage.clearAuthTokens();
    }
  },

  async getMe(): Promise<User & { profile: Profile }> {
    const response = await apiClient.get<any>('/users/me');
    return {
      id: response.id,
      email: response.email,
      createdAt: response.created_at,
      profile: response.profile ? {
        userId: response.profile.user_id,
        age: response.profile.age,
        sex: response.profile.sex,
        height: response.profile.height_cm,
        weight: response.profile.weight_kg,
        activityLevel: response.profile.activity_level,
        goal: response.profile.goal,
        units: response.profile.units,
      } : undefined,
    };
  },
};
