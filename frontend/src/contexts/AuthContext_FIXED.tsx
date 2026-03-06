import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { authService } from "@/services/auth";
import { apiClient, ApiError } from "@/services/api/client";

interface User {
  id: string;
  name: string;
  email: string;
  clinicName: string;
  role: 'ADMIN' | 'DOCTOR' | 'STAFF';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, clinicName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore user from session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        if (token) {
          apiClient.setAccessToken(token);
          // Try to get current user profile
          const userProfile = await authService.getCurrentUser();
          setUser(userProfile);
        }
      } catch (err) {
        console.error("Session restore failed:", err);
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Login failed";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, clinicName: string) => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await authService.register({ name, email, password, clinicName });
        setUser(response.user);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Registration failed";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      setError(null);
      await authService.logout();
    } catch (err) {
      // Even if logout API call fails, clear local state
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
