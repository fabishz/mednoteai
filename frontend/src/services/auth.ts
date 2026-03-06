/**
 * src/services/auth.ts
 * 
 * Authentication service
 * Handles login, register, logout, and token management
 */

import { apiClient, ApiError } from './api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  clinicName: string;
  role: 'ADMIN' | 'DOCTOR' | 'STAFF';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  clinicName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<any>(
        '/auth/login',
        credentials
      );

      // Backend returns: {success, message, data: {accessToken, refreshToken, expiresIn, user}}
      const { accessToken, refreshToken, expiresIn, user } = response.data.data;
      if (!accessToken || !refreshToken || !user) {
        throw new Error('Invalid login response from server');
      }

      // Store tokens
      this.storeTokens(accessToken, refreshToken);

      return { user, accessToken, refreshToken, expiresIn };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Login failed');
      }
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<any>(
        '/auth/register',
        data
      );

      // Backend returns: {success, message, data: {accessToken, refreshToken, expiresIn, user}}
      const { accessToken, refreshToken, expiresIn, user } = response.data.data;
      if (!accessToken || !refreshToken || !user) {
        throw new Error('Invalid registration response from server');
      }

      // Store tokens
      this.storeTokens(accessToken, refreshToken);

      return { user, accessToken, refreshToken, expiresIn };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Registration failed');
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<any>('/auth/me');
    // Backend returns: {success, message, data: {user}}
    return response.data.data;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/request-reset', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  }

  /**
   * Store tokens in secure storage
   */
  private storeTokens(accessToken: string, refreshToken: string) {
    try {
      // Store in sessionStorage (cleared when tab closes)
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);

      // Set token in API client
      apiClient.setAccessToken(accessToken);
    } catch (error) {
      // Handle quota exceeded or private browsing mode
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to save authentication session. Please check your browser settings.');
    }
  }

  /**
   * Clear tokens
   */
  private clearTokens() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    apiClient.clearTokens();
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem('accessToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
