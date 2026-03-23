"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { insforge } from '@/lib/insforge';

import { User, UserRole } from '@/types/auth';

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

function isAdminEmail(email: string): boolean {
  const envEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return envEmails.includes(email.trim().toLowerCase());
}

function normalizeRole(role: UserRole, email: string): UserRole {
  if (isAdminEmail(email) && role !== 'admin' && role !== 'super_admin') {
    return 'admin';
  }

  return role;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const clearAuthCookies = useCallback(() => {
    document.cookie = 'tm_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'tm_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }, []);

  const syncAuthCookies = useCallback((token: string, role: UserRole) => {
    clearAuthCookies();
    document.cookie = `tm_access_token=${token}; path=/; max-age=3600; SameSite=Lax`;
    document.cookie = `tm_role=${role}; path=/; max-age=3600; SameSite=Lax`;
  }, [clearAuthCookies]);

  const fetchProfile = useCallback(async (userId: string, email: string, metadata?: Record<string, any>): Promise<User | null> => {
    try {
      const { data: profile, error } = await insforge.database
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        // Fallback: create profile if it doesn't exist
        const fallbackRole = normalizeRole(((metadata?.role as UserRole) || 'candidate'), email);
        const fallbackName = email.split('@')[0];
        
        const { data: newProfile, error: insertError } = await insforge.database
          .from('profiles')
          .insert([{
            id: userId,
            email,
            role: fallbackRole,
            name: fallbackName
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating fallback profile:', insertError.message);
          return null;
        }

        return {
          id: userId,
          email,
          role: normalizeRole(newProfile.role as UserRole, email),
          name: newProfile.name || fallbackName,
          avatar_url: newProfile.avatar_url || null,
        };
      }

      const resolvedRole = normalizeRole(((profile?.role as UserRole) || 'candidate'), email);

      return {
        id: userId,
        email,
        role: resolvedRole,
        name: profile?.name || '',
        avatar_url: profile?.avatar_url || null,
        company_id: profile?.company_id,
        created_at: profile?.created_at,
        mfa_enabled: profile?.mfa_enabled || false,
        password_set_at: profile?.password_set_at,
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

      document.cookie = `tm_role=${resolvedUser.role}; path=/; max-age=3600; SameSite=Lax`;
      setUser(resolvedUser);
      return resolvedUser;
    } catch (err) {
      console.error('Refresh user error:', err);
      clearAuthCookies();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthCookies]);

  useEffect(() => {
    refreshUser();
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

      syncAuthCookies(data.accessToken, fullUser.role);
      setUser(fullUser);
      return { user: fullUser };
    } catch (err) {
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
        await insforge.database
          .from('profiles')
          .update({ role })
          .eq('id', data.user.id);
      }

      await refreshUser();
      return { requireEmailVerification: data?.requireEmailVerification };
    } catch (err) {
      return { error: 'An unexpected error occurred during sign up.' };
    }
  };

  const signOut = async () => {
    const roleBeforeSignOut = user?.role;
    await insforge.auth.signOut();
    
    clearAuthCookies();
    
    setUser(null);
    if (roleBeforeSignOut === 'admin' || roleBeforeSignOut === 'super_admin') {
      router.push('/login');
    } else {
      router.push('/login');
    }
  };

  const login = useCallback((token: string, authUser: User) => {
    syncAuthCookies(token, authUser.role);
    setUser(authUser);
  }, [syncAuthCookies]);

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
