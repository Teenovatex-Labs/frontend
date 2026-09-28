"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, ApiError, type UserProfile } from "@/lib/api";

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    full_name: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<{ email: string; require_verification: boolean }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
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
      const result = await authApi.register(data);
      return { email: result.email, require_verification: result.require_verification };
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
      throw err;
    }
  };

  const verifyEmail: AuthContextValue["verifyEmail"] = async (email, code) => {
    setError(null);
    try {
      await authApi.verifyEmail({ email, code });
      await afterAuth();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
      throw err;
    }
  };

  const resendVerification: AuthContextValue["resendVerification"] = async (email) => {
    setError(null);
    try {
      await authApi.resendVerification(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't resend the code");
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
    <AuthContext.Provider
      value={{ user, loading, error, login, register, verifyEmail, resendVerification, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
