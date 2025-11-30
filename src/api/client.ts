// File: src/api/client.ts

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { ApiError, AuthTokens } from '../types';

const API_BASE_URL = 'https://api.trackforge.example';

type AxiosRequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };
type RefreshSubscriber = (token: string) => void;
type RefreshErrorSubscriber = (error: ApiError) => void;

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: RefreshSubscriber[] = [];
  private refreshErrorSubscribers: RefreshErrorSubscriber[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const tokens = await storage.getAuthTokens();
        if (tokens && config.headers) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const status = error.response?.status;
        const originalRequest = error.config as AxiosRequestConfigWithRetry | undefined;

        if (status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          const tokens = await storage.getAuthTokens();

          if (tokens?.refreshToken) {
            if (this.isRefreshing) {
              return new Promise((resolve, reject) => {
                this.subscribeTokenRefresh((newToken) => {
                  if (!originalRequest.headers) {
                    originalRequest.headers = {};
                  }
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                  resolve(this.client(originalRequest));
                });
                this.subscribeRefreshError((refreshError) => reject(refreshError));
              });
            }

            this.isRefreshing = true;

            try {
              const newTokens = await this.refreshAccessToken(tokens.refreshToken);
              await storage.setAuthTokens(newTokens);
              this.notifyTokenRefreshed(newTokens.accessToken);

              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              await storage.clearAuthTokens();
              const formattedError = this.formatError(refreshError as AxiosError<ApiError>);
              this.notifyRefreshFailed(formattedError);
              return Promise.reject(formattedError);
            } finally {
              this.isRefreshing = false;
            }
          }

          await storage.clearAuthTokens();
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post<{ tokens: AuthTokens }>(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    return response.data.tokens;
  }

  private subscribeTokenRefresh(callback: RefreshSubscriber): void {
    this.refreshSubscribers.push(callback);
  }

  private subscribeRefreshError(callback: RefreshErrorSubscriber): void {
    this.refreshErrorSubscribers.push(callback);
  }

  private notifyTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
    this.refreshErrorSubscribers = [];
  }

  private notifyRefreshFailed(error: ApiError): void {
    this.refreshErrorSubscribers.forEach((callback) => callback(error));
    this.refreshSubscribers = [];
    this.refreshErrorSubscribers = [];
  }

  private formatError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return error.response.data;
    }
    if (error.message === 'Network Error') {
      return { message: 'Network error. Please check your connection.' };
    }
    return { message: error.message || 'An unexpected error occurred' };
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();

