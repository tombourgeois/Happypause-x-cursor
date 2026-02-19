import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiGet, setAccessToken } from '../services/api';

const TOKEN_KEY = 'happypause_access_token';
const REFRESH_KEY = 'happypause_refresh_token';
const USER_KEY = 'happypause_user';
const GUEST_KEY = 'happypause_guest_mode';

interface User {
  userId: string;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  applyTokens: (accessToken: string, refreshToken: string, userId: string, email: string) => void;
  hasCompletedAuth: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
    isGuest: false,
  });

  const persistTokens = useCallback(async (access: string, refresh: string, user: User) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, access],
      [REFRESH_KEY, refresh],
      [USER_KEY, JSON.stringify(user)],
    ]);
  }, []);

  const clearTokens = useCallback(async () => {
    setAccessToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, USER_KEY]);
    setState({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
      isGuest: false,
    });
  }, []);

  const setTokens = useCallback((access: string, refresh: string, user: User) => {
    setAccessToken(access);
    persistTokens(access, refresh, user);
    AsyncStorage.removeItem(GUEST_KEY);
    setState({
      user,
      accessToken: access,
      isLoading: false,
      isAuthenticated: true,
      isGuest: false,
    });
  }, [persistTokens]);

  const refreshAuth = useCallback(async () => {
    const refresh = await AsyncStorage.getItem(REFRESH_KEY);
    if (!refresh) {
      await clearTokens();
      return;
    }
    try {
      const res = await apiPost<{ accessToken: string; refreshToken: string; userId: string; email: string }>(
        '/auth/refresh',
        { refreshToken: refresh }
      );
      const user = { userId: res.userId, email: res.email };
      setTokens(res.accessToken, res.refreshToken, user);
    } catch {
      await clearTokens();
    }
  }, [clearTokens, setTokens]);

  useEffect(() => {
    (async () => {
      const access = await AsyncStorage.getItem(TOKEN_KEY);
      const userJson = await AsyncStorage.getItem(USER_KEY);
      const guest = await AsyncStorage.getItem(GUEST_KEY);

      if (access && userJson) {
        setAccessToken(access);
        try {
          const me = await apiGet<{ userId: string; email: string }>('/auth/me');
          setState({
            user: { userId: me.userId, email: me.email },
            accessToken: access,
            isLoading: false,
            isAuthenticated: true,
            isGuest: false,
          });
        } catch {
          await refreshAuth();
        }
      } else if (guest === '1') {
        setState((s) => ({ ...s, isLoading: false, isGuest: true }));
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<{
      accessToken: string;
      refreshToken: string;
      userId: string;
      email: string;
    }>('/auth/login', { email: email.trim().toLowerCase(), password });
    const user = { userId: res.userId, email: res.email };
    setTokens(res.accessToken, res.refreshToken, user);
  }, [setTokens]);

  const register = useCallback(async (email: string, password: string) => {
    const res = await apiPost<{
      accessToken: string;
      refreshToken: string;
      userId: string;
      email: string;
    }>('/auth/register', { email: email.trim().toLowerCase(), password });
    const user = { userId: res.userId, email: res.email };
    setTokens(res.accessToken, res.refreshToken, user);
  }, [setTokens]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(GUEST_KEY);
    await clearTokens();
  }, [clearTokens]);

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_KEY, '1');
    setState((s) => ({ ...s, isLoading: false, isGuest: true }));
  }, []);

  const applyTokens = useCallback((accessToken: string, refreshToken: string, userId: string, email: string) => {
    setTokens(accessToken, refreshToken, { userId, email });
  }, [setTokens]);

  const forgotPassword = useCallback(async (email: string) => {
    await apiPost('/auth/forgot-password', { email: email.trim().toLowerCase() });
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      const res = await apiPost<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        email: string;
      }>('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });
      const user = { userId: res.userId, email: res.email };
      setTokens(res.accessToken, res.refreshToken, user);
    },
    [setTokens]
  );

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshAuth,
    continueAsGuest,
    applyTokens,
    hasCompletedAuth: state.isAuthenticated || state.isGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
