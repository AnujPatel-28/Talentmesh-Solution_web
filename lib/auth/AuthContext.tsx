"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { insforge } from '@/lib/insforge';
import type { User, UserRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; user?: User | null; accessToken?: string }>;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const clearAuthCookies = useCallback(() => {
    document.cookie = 'tm_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'tm_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'tm_admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  const syncAuthCookies = useCallback(async (token: string, authUser: Pick<User, 'role' | 'email'>) => {
    clearAuthCookies();

    // Set token in local cookie so invokeFunction can find it immediately
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `tm_access_token=${token}; path=/; SameSite=None; ${isSecure ? 'Secure;' : ''} max-age=${60 * 60 * 24 * 7}`;

    const adminAccess = authUser.role === 'admin' || authUser.role === 'super_admin' || isAdminEmail(authUser.email);

    // Call the auth-session edge function to set cookies in the function domain
    const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    await fetch(`${baseUrl}/functions/auth-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-client-info': 'talentmesh-web'
      },
      body: JSON.stringify({
        token,
        role: authUser.role,
        adminAccess,
      }),
      credentials: 'include'
    }).catch(console.error);
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
      // Extract token from cookies for verification
      let token;
      if (typeof window !== 'undefined') {
        const match = document.cookie.match(/tm_access_token=([^;]+)/);
        token = match ? match[1] : null;
      }

      const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
      const response = await fetch(`${baseUrl}/functions/auth-session`, {
        method: 'GET',
        headers: {
          'x-client-info': 'talentmesh-web',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });


      if (!response.ok) {
        clearAuthCookies();
        setUser(null);
        return null;
      }

      const payload = await response.json();

      if (!payload?.user) {
        clearAuthCookies();
        setUser(null);
        return null;
      }

      const resolvedUser = payload.user as User;

      document.cookie = `tm_role=${resolvedUser.role}; path=/; SameSite=Lax`;
      if (resolvedUser.role === 'admin' || resolvedUser.role === 'super_admin' || isAdminEmail(resolvedUser.email)) {
        document.cookie = 'tm_admin_access=true; path=/; SameSite=Lax';
      }

      // Sync token to local cookie if returned by session refresh
      if (payload.token) {
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
        document.cookie = `tm_access_token=${payload.token}; path=/; SameSite=None; ${isSecure ? 'Secure;' : ''} max-age=${60 * 60 * 24 * 7}`;
      }

      setUser(resolvedUser);
      cacheUser(resolvedUser);

      // Feature 17: Proactive prefetch of dashboard to reduce redirect lag
      if (typeof window !== 'undefined') {
        const dashboardPath = resolvedUser.role === 'admin' || resolvedUser.role === 'super_admin'
          ? '/dashboard/admin'
          : `/dashboard/${resolvedUser.role}/${resolvedUser.id}`;
        router.prefetch(dashboardPath);
      }

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
      setIsInitialized(true);
    }
  }, [cacheUser, clearAuthCookies]);

  // Session Refresh Interval (every 10 minutes to prevent 15m expiry)
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        console.log('[AuthContext] Proactive session refresh...');
        refreshUser();
      }, 1000 * 60 * 10);
      return () => clearInterval(interval);
    }
  }, [user, refreshUser]);

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
    const isAuthPage = typeof window !== 'undefined' &&
      (window.location.pathname === '/auth/callback' || window.location.pathname === '/login');

    if ((hasLoadedCached || hasAccessToken) && !isAuthPage) {
      refreshUser();
    } else {
      setIsLoading(false);
      setIsInitialized(true);
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

      await syncAuthCookies(data.accessToken, fullUser);
      setUser(fullUser);
      cacheUser(fullUser);
      return { user: fullUser, accessToken: data.accessToken };
    } catch {
      return { error: 'An unexpected error occurred during sign in.' };
    }
  };


  const signUp = async (email: string, password: string, role: UserRole, name: string) => {
    try {
      // Use the auth-signup edge function which handles both auth and profile creation
      const { data, error } = await insforge.functions.invoke('auth-signup', {
        body: { email, password, role, name }
      });

      if (error) {
        return { error: error.message };
      }

      // If we got an access token (email verification not required), set up the session
      if (data?.accessToken && data?.user) {
        // Construct user object from response
        const fullUser: User = {
          id: data.user.id,
          email: data.user.email,
          role: normalizeRole(role, email),
          name: name,
          avatar_url: null,
          created_at: new Date().toISOString(),
          mfa_enabled: false
        };

        await syncAuthCookies(data.accessToken, fullUser);
        setUser(fullUser);
        cacheUser(fullUser);
      }

      return { requireEmailVerification: data?.requireEmailVerification };
    } catch {
      return { error: 'An unexpected error occurred during sign up.' };
    }
  };

  const signOut = async () => {
    await insforge.auth.signOut();
    // Call the auth-session edge function to clear cookies
    const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    await fetch(`${baseUrl}/functions/auth-session`, {
      method: 'DELETE',
      headers: {
        'x-client-info': 'talentmesh-web'
      },
      credentials: 'include'
    }).catch(() => undefined);

    clearAuthCookies();
    setUser(null);
    window.location.replace('/login');
  };

  const login = useCallback(async (token: string, authUser: User) => {
    await syncAuthCookies(token, authUser);
    setUser(authUser);
    cacheUser(authUser);
  }, [cacheUser, syncAuthCookies]);

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, isInitialized, signIn, signUp, signOut, logout: signOut, refreshUser, login }}>
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
