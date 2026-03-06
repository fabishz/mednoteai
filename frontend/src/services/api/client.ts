/**
 * src/services/api/client.ts
 * 
 * Centralized HTTP client with axios
 * Handles authentication, interceptors, error handling
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshTokenInProgress: boolean = false;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle 401 and refresh token
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Wait for token refresh if already in progress
            if (this.refreshTokenInProgress && this.refreshTokenPromise) {
              await this.refreshTokenPromise;
              // Retry original request with new token
              return this.client(originalRequest);
            }

            // Start token refresh
            if (!this.refreshTokenInProgress) {
              const newToken = await this.refreshAccessToken();
              this.accessToken = newToken;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - redirect to login
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenInProgress && this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenInProgress = true;

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<{ success: boolean; data: { accessToken: string; expiresIn: number } }>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 5000 }
        );

        const newAccessToken = response.data.data.accessToken;
        this.accessToken = newAccessToken;
        sessionStorage.setItem('accessToken', newAccessToken);

        return newAccessToken;
      } finally {
        this.refreshTokenInProgress = false;
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message =
        (error.response.data as any)?.message ||
        error.message ||
        'An error occurred';

      return new ApiError(status, message, error.response.data);
    } else if (error.request) {
      // Request made but no response
      return new ApiError(
        0,
        'No response from server. Check your connection.',
        null
      );
    } else {
      // Error in request setup
      return new ApiError(0, error.message, null);
    }
  }

  /**
   * Clear all stored tokens
   */
  clearTokens() {
    this.accessToken = null;
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }

  // HTTP methods
  async get<T>(url: string, config?: any): Promise<AxiosResponse<T>> {
    const response = await this.client.get<T>(url, config);
    return response;
  }

  async post<T>(url: string, data?: unknown, config?: any): Promise<AxiosResponse<T>> {
    const response = await this.client.post<T>(url, data, config);
    return response;
  }

  async put<T>(url: string, data?: unknown, config?: any): Promise<AxiosResponse<T>> {
    const response = await this.client.put<T>(url, data, config);
    return response;
  }

  async patch<T>(url: string, data?: unknown, config?: any): Promise<AxiosResponse<T>> {
    const response = await this.client.patch<T>(url, data, config);
    return response;
  }

  async delete<T>(url: string, config?: any): Promise<AxiosResponse<T>> {
    const response = await this.client.delete<T>(url, config);
    return response;
  }
}

export const apiClient = new ApiClient();
