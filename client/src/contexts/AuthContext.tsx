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
  rememberMe?: boolean;
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
  rememberMe: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'prolium_session';

const saveSession = (userId: string, email: string, rememberMe: boolean) => {
  const expiryTime = rememberMe
    ? Date.now() + (7 * 24 * 60 * 60 * 1000)
    : Date.now() + (24 * 60 * 60 * 1000);
  const sessionData: SessionData = { userId, email, expiresAt: expiryTime, rememberMe };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  console.log('[AuthContext] Session saved, rememberMe:', rememberMe, 'expires:', new Date(expiryTime));
};

const getSession = (): SessionData | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const session: SessionData = JSON.parse(stored);
    if (session.rememberMe === undefined) { session.rememberMe = false; }
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    console.log('[AuthContext] Valid session found, rememberMe:', session.rememberMe);
    return session;
  } catch (error) {
    return null;
  }
};

const clearSession = () => { localStorage.removeItem(SESSION_KEY); };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const existingSession = getSession();
      const response = await authApi.getCurrentUser();
      setUser(response.data.user);
      const rememberMe = existingSession !== null
        ? existingSession.rememberMe
        : (response.data.user.rememberMe ?? false);
      saveSession(response.data.user.id, response.data.user.email, rememberMe);
      console.log('[AuthContext] checkAuth ok, rememberMe:', rememberMe);
    } catch (error: any) {
      console.log('[AuthContext] Auth failed:', error.response?.status || error.message);
      clearSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await authApi.login({ email, password, rememberMe });
    const userData = response.data.user;
    saveSession(userData.id, userData.email, rememberMe);
    setUser(userData);
    console.log('[AuthContext] Login ok, rememberMe:', rememberMe);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (error) { console.error('[AuthContext] Logout failed:', error); }
    clearSession();
    setUser(null);
    window.location.href = '/';
  };

  const register = async (email: string, password: string, name?: string) => {
    await authApi.register({ email, password, name });
  };

  const refreshUser = async () => {
    try {
      const existingSession = getSession();
      const response = await authApi.getCurrentUser();
      setUser(response.data.user);
      if (response.data.user) {
        const rememberMe = existingSession !== null
          ? existingSession.rememberMe
          : (response.data.user.rememberMe ?? false);
        saveSession(response.data.user.id, response.data.user.email, rememberMe);
      }
    } catch (error) { clearSession(); setUser(null); }
  };

  const ctxValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) { throw new Error('useAuth must be used within AuthProvider'); }
  return context;
};
