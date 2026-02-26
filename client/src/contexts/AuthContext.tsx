/**
 * Authentication Context
 * Provides global authentication state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../utils/apiClient';

interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  rememberMe?: boolean; // From backend - inferred from session expiry
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface SessionData {
  userId: string;
  email: string;
  expiresAt: number;
  rememberMe: boolean; // Store the original preference
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'prolium_session';

// Session storage helpers
const saveSession = (userId: string, email: string, rememberMe: boolean) => {
  const expiryTime = rememberMe
    ? Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    : Date.now() + (24 * 60 * 60 * 1000);     // 1 day (default)

  const sessionData: SessionData = {
    userId,
    email,
    expiresAt: expiryTime,
    rememberMe, // Store the preference so we can preserve it
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  console.log('[AuthContext] Session saved, rememberMe:', rememberMe, 'expires:', new Date(expiryTime));
};

const getSession = (): SessionData | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session: SessionData = JSON.parse(stored);

    // Migrate old sessions without rememberMe field (default to false for security)
    if (session.rememberMe === undefined) {
      session.rememberMe = false;
      console.log('[AuthContext] Migrating old session, defaulting rememberMe to false');
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      console.log('[AuthContext] Session expired, clearing');
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    console.log('[AuthContext] Valid session found, rememberMe:', session.rememberMe, 'expires:', new Date(session.expiresAt));
    return session;
  } catch (error) {
    console.error('[AuthContext] Error reading session:', error);
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  console.log('[AuthContext] Session cleared');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[AuthContext] Checking authentication with server...');

      // ALWAYS try to verify with server - cookies might still be valid even if localStorage expired
      const response = await authApi.getCurrentUser();
      console.log('[AuthContext] User authenticated:', response.data.user.email);
      setUser(response.data.user);

      // Use rememberMe value from backend (inferred from session expiry)
      const rememberMe = response.data.user.rememberMe ?? false;
      saveSession(response.data.user.id, response.data.user.email, rememberMe);
      console.log('[AuthContext] Session restored, rememberMe:', rememberMe);
    } catch (error: any) {
      console.log('[AuthContext] Authentication failed:', error.response?.status || error.message);
      clearSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await authApi.login({ email, password, rememberMe });
    const userData = response.data.user;

    // Save session to localStorage
    saveSession(userData.id, userData.email, rememberMe);

    setUser(userData);
    console.log('[AuthContext] Login successful, remember me:', rememberMe);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('[AuthContext] Logout API failed:', error);
    }

    // Always clear local session
    clearSession();
    setUser(null);
    window.location.href = '/';
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await authApi.register({ email, password, name });
    // After registration, user needs to verify email
    // Don't set user yet
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data.user);

      // Use rememberMe from backend (inferred from session expiry)
      if (response.data.user) {
        const rememberMe = response.data.user.rememberMe ?? false;
        saveSession(response.data.user.id, response.data.user.email, rememberMe);
      }
    } catch (error) {
      clearSession();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
