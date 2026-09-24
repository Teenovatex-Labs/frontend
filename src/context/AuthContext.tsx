"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, ApiError, type UserProfile } from "@/lib/api";

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { full_name: string; username: string; email: string; password: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const restored = await authApi.bootstrapFromRefreshToken();
      if (restored) {
        try {
          setUser(await authApi.me());
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const afterAuth = async () => {
    setUser(await authApi.me());
  };

  const login: AuthContextValue["login"] = async (email, password) => {
    setError(null);
    try {
      await authApi.login({ email, password });
      await afterAuth();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      throw err;
    }
  };

  const register: AuthContextValue["register"] = async (data) => {
    setError(null);
    try {
      await authApi.register(data);
      await afterAuth();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
      throw err;
    }
  };

  const loginWithGoogle: AuthContextValue["loginWithGoogle"] = async (idToken) => {
    setError(null);
    try {
      await authApi.google(idToken);
      await afterAuth();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Google sign-in failed");
      throw err;
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
