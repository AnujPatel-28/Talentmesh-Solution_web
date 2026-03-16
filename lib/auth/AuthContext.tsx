"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { insforge } from '@/lib/insforge';

interface User {
  id: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'super_admin';
  full_name?: string;
  company_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session } } = await insforge.auth.getCurrentSession();
        if (session) {
          // Fetch role from profiles table
          const { data: profile } = await insforge.database
            .from('profiles')
            .select('role, full_name, company_id')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: profile?.role || 'candidate',
            full_name: profile?.full_name || '',
            company_id: profile?.company_id || undefined,
          });
        }
      } catch (err) {
        console.error('Session error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    getSession();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setUser(newUser);
    // Redirect based on role
    if (newUser.role === 'super_admin') router.push('/dashboard/admin');
    else if (newUser.role === 'recruiter') router.push('/dashboard/recruiter');
    else router.push('/dashboard/candidate');
  };

  const logout = async () => {
    await insforge.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
