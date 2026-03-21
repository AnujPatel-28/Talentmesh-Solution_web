"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { insforge } from '@/lib/insforge';

export type UserRole = 'candidate' | 'recruiter' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  company_id?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, role: UserRole, name: string) => Promise<{ error?: string; requireEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    try {
      const { data: profile, error } = await insforge.database
        .from('profiles')
        .select('name, role, avatar_url, company_id, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }

      return {
        id: userId,
        email,
        role: (profile?.role as UserRole) || 'candidate',
        name: profile?.name || '',
        avatar_url: profile?.avatar_url,
        company_id: profile?.company_id,
        created_at: profile?.created_at,
      };
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await insforge.auth.getCurrentSession();
      if (session?.user) {
        const fullUser = await fetchProfile(session.user.id, session.user.email!);
        setUser(fullUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    // 1. Initial session check
    refreshUser();

    // 2. Note: onAuthStateChange is not supported in this SDK version.
    // We rely on manual refreshes in signIn/signUp/signOut.
  }, [refreshUser]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await insforge.auth.signInWithPassword({ email, password });

      if (error) {
        // Handle common InsForge/Supabase error codes
        let message = error.message;
        if (message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please try again.';
        } else if (message.includes('Email not confirmed')) {
          message = 'Please confirm your email address before logging in.';
        }
        return { error: message };
      }

      await refreshUser();
      return {};
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

      // If user is created and they have a profile, we can update it with the role
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
    await insforge.auth.signOut();
    document.cookie = 'tm_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'tm_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    router.push('/');
  };

  const login = useCallback((token: string, user: User) => {
    // Set cookies for middleware
    document.cookie = `tm_access_token=${token}; path=/; max-age=3600; SameSite=Lax`;
    document.cookie = `tm_role=${user.role}; path=/; max-age=3600; SameSite=Lax`;
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, logout: signOut, refreshUser, login }}>
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
