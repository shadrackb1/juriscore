import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  university?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (name: string, email: string, password: string, university?: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const TOKEN_KEY = 'juriscore_token';
const USER_KEY = 'juriscore_user';

const AuthContext = createContext<AuthContextValue | null>(null);

async function storageGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function storageDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function authRequest(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/v1/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Request failed');
  }
  return data as { token: string; user: AuthUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          storageGet(TOKEN_KEY),
          storageGet(USER_KEY),
        ]);
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch {
        // ignore corrupt storage
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await Promise.all([
      storageSet(TOKEN_KEY, nextToken),
      storageSet(USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await authRequest('login', { email, password });
    await persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const signUp = useCallback(async (name: string, email: string, password: string, university?: string) => {
    const data = await authRequest('signup', { name, email, password, university });
    await persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const signOut = useCallback(async () => {
    setUser(null);
    setToken(null);
    await Promise.all([storageDelete(TOKEN_KEY), storageDelete(USER_KEY)]);
  }, []);

  const getToken = useCallback(async () => token, [token]);

  const value = useMemo(
    () => ({ user, token, loading, signIn, signUp, signOut, getToken }),
    [user, token, loading, signIn, signUp, signOut, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
