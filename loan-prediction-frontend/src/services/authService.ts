import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const getApiBaseUrl = () => {
  // In browser environments, prefer using the proxy path to avoid CORS
  // The dev server will proxy /api requests to the backend
  if (typeof window !== 'undefined') {
    // Always use /api in browser - the dev proxy or production reverse proxy will handle routing
    return '/api';
  }
  
  // Fallback for non-browser environments (SSR, tests, etc.)
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Token storage keys
const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'loan_officer' | 'underwriter' | 'analyst' | 'viewer';
  department: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user: User;
  };
  message?: string;
}

export interface RefreshResponse {
  success: boolean;
  data?: {
    token: string;
  };
  message?: string;
}

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class AuthService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.refreshPromise = null;

    // Request interceptor to add token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api.request(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Login with email and password
   */
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Login attempt:', {
        username: credentials.username,
        hasPassword: !!credentials.password,
        baseURL: this.api.defaults.baseURL
      });

      const response = await this.api.post<AuthResponse>('/auth/login', credentials);

      console.log('Login response:', {
        status: response.status,
        success: response.data.success,
        hasData: !!response.data.data
      });

      if (response.data.success && response.data.data) {
        const { token, refreshToken, user } = response.data.data;
        this.setAccessToken(token);
        this.setRefreshToken(refreshToken);
        this.setUser(user);
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', {
        message: (error as Error).message,
        response: (error as AxiosError).response?.data
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<RefreshResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.data.success && response.data.data) {
          const { token } = response.data.data;
          this.setAccessToken(token);
          return token;
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (error) {
        this.clearAuthData();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Get current user information
   */
  public async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get<AuthResponse>('/auth/me');
      
      if (response.data.success && response.data.data) {
        const user = response.data.data.user;
        this.setUser(user);
        return user;
      } else {
        throw new Error('Failed to get user info');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 
                     error.message ||
                     'Failed to get user information';
      throw new Error(message);
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get stored user data
   */
  public getUser(): User | null {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get access token
   */
  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Store access token
   */
  private setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  /**
   * Store refresh token
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  /**
   * Store user data
   */
  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Check user role
   */
  public hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;
