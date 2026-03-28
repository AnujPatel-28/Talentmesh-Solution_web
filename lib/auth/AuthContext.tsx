"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { insforge } from '@/lib/insforge';
import type { User, UserRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; user?: User | null }>;
  signUp: (email: string, password: string, role: UserRole, name: string) => Promise<{ error?: string; requireEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  login: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.trim().toLowerCase());
}

function normalizeRole(role: UserRole, email: string): UserRole {
  if (isAdminEmail(email)) {
    return 'admin';
  }

  return role;
}

const USER_STORAGE_KEY = 'tm_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const clearAuthCookies = useCallback(() => {
    document.cookie = 'tm_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'tm_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'tm_admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  const syncAuthCookies = useCallback((token: string, authUser: Pick<User, 'role' | 'email'>) => {
    clearAuthCookies();
    document.cookie = `tm_access_token=${token}; path=/; SameSite=Lax`;
    document.cookie = `tm_role=${authUser.role}; path=/; SameSite=Lax`;

    if (authUser.role === 'admin' || authUser.role === 'super_admin' || isAdminEmail(authUser.email)) {
      document.cookie = 'tm_admin_access=true; path=/; SameSite=Lax';
    }
  }, [clearAuthCookies]);

  const cacheUser = useCallback((authUser: User | null) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!authUser) {
      window.sessionStorage.removeItem(USER_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
  }, []);

  const fetchProfile = useCallback(async (
    userId: string,
    email: string,
    metadata?: Record<string, unknown>,
  ): Promise<User | null> => {
    try {
      const { data: profile, error } = await insforge.database
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        const fallbackRole = normalizeRole(((metadata?.role as UserRole) || 'candidate'), email);
        const fallbackName = email.split('@')[0];

        try {
          const { data: createdProfile, error: insertError } = await insforge.database
            .from('profiles')
            /* changed this .insert([{
              id: userId,
              email,
              role: fallbackRole,
              name: fallbackName,
            }])*/
            .insert([{
              id: userId,
              email,
              role: fallbackRole,
              name: fallbackName,
              completed_onboarding: false,
            }])
            .select()
            .single();

          if (!insertError && createdProfile) {
            return {
              id: userId,
              email,
              role: normalizeRole(createdProfile.role as UserRole, email),
              name: createdProfile.name || fallbackName,
              avatar_url: createdProfile.avatar_url || null,
              company_id: createdProfile.company_id,
              created_at: createdProfile.created_at,
              mfa_enabled: createdProfile.mfa_enabled || false,
              password_set_at: createdProfile.password_set_at,
            };
          }
        } catch {
          // Fall through to a minimal in-memory user object.
        }

        return {
          id: userId,
          email,
          role: fallbackRole,
          name: fallbackName,
          avatar_url: null,
        };
      }

      return {
        id: userId,
        email,
        role: normalizeRole(((profile.role as UserRole) || 'candidate'), email),
        name: profile.name || '',
        avatar_url: profile.avatar_url || null,
        company_id: profile.company_id,
        created_at: profile.created_at,
        mfa_enabled: profile.mfa_enabled || false,
        password_set_at: profile.password_set_at,
      };
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        clearAuthCookies();
        setUser(null);
        return null;
      }

      const payload = await response.json();
      const resolvedUser = (payload?.user || null) as User | null;

      if (!resolvedUser) {
        clearAuthCookies();
        setUser(null);
        return null;
      }

      document.cookie = `tm_role=${resolvedUser.role}; path=/; SameSite=Lax`;
      if (resolvedUser.role === 'admin' || resolvedUser.role === 'super_admin' || isAdminEmail(resolvedUser.email)) {
        document.cookie = 'tm_admin_access=true; path=/; SameSite=Lax';
      }

      setUser(resolvedUser);
      cacheUser(resolvedUser);
      return resolvedUser;
    } catch (err) {
      if (!(err instanceof TypeError && err.message === 'Failed to fetch')) {
        console.error('Refresh user error:', err);
      }

      clearAuthCookies();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cacheUser, clearAuthCookies]);

  useEffect(() => {
    let hasLoadedCached = false;
    try {
      const cached = window.sessionStorage.getItem(USER_STORAGE_KEY);
      if (cached) {
        setUser(JSON.parse(cached) as User);
        hasLoadedCached = true;
      }
    } catch {
      window.sessionStorage.removeItem(USER_STORAGE_KEY);
    }

    // Auto-refresh if we have a cached user OR a matching access cookie.
    // This ensures cookie-only sessions (OAuth returns) are picked up on mount.
    const hasAccessToken = document.cookie.includes('tm_access_token');

    if (hasLoadedCached || hasAccessToken) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await insforge.auth.signInWithPassword({ email, password });

      if (error) {
        let message = error.message;
        if (message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please try again.';
        } else if (message.includes('Email not confirmed')) {
          message = 'Please confirm your email address before logging in.';
        }
        return { error: message };
      }

      if (!data?.accessToken || !data.user?.id || !data.user?.email) {
        return { error: 'Sign in succeeded, but the session payload was incomplete.' };
      }

      const fullUser = await fetchProfile(data.user.id, data.user.email, data.user.metadata || undefined);
      if (!fullUser) {
        return { error: 'Signed in, but failed to load your profile.' };
      }

      syncAuthCookies(data.accessToken, fullUser);
      setUser(fullUser);
      cacheUser(fullUser);
      return { user: fullUser };
    } catch {
      return { error: 'An unexpected error occurred during sign in.' };
    }
  };

  const signUp = async (email: string, password: string, role: UserRole, name: string) => {
    try {
      const { error, data } = await insforge.auth.signUp({
        email,
        password,
        name,
      });

      if (error) {
        return { error: error.message };
      }

      if (data?.user) {
        const { error: profileError } = await insforge.database
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            role,
            name,
            completed_onboarding: false,
          }]);

        if (profileError) {
          return { error: profileError.message };
        }
      }

      // If we got an access token (email verification not required), set up the session
      if (data?.accessToken && data?.user) {
        const fullUser = await fetchProfile(data.user.id, data.user.email, data.user.metadata as Record<string, unknown> || undefined);
        if (fullUser) {
          syncAuthCookies(data.accessToken, fullUser);
          setUser(fullUser);
          cacheUser(fullUser);
        }
      }

      return { requireEmailVerification: data?.requireEmailVerification };
    } catch {
      return { error: 'An unexpected error occurred during sign up.' };
    }
  };

  const signOut = async () => {
    await insforge.auth.signOut();
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => undefined);
    clearAuthCookies();
    setUser(null);
    window.location.replace('/login');
  };

  const login = useCallback((token: string, authUser: User) => {
    syncAuthCookies(token, authUser);
    setUser(authUser);
    cacheUser(authUser);
  }, [cacheUser, syncAuthCookies]);

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, signIn, signUp, signOut, logout: signOut, refreshUser, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
