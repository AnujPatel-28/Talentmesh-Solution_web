"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { insforge, directInsforge, refreshAccessToken } from '@/lib/insforge';
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
  isImpersonating: boolean;
  impersonatedUser?: { id: string; role: string } | null;
  adminId?: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


const USER_STORAGE_KEY = 'tm_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<{ id: string; role: string } | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const router = useRouter();

  const isImpersonating = !!impersonatedUser && !!adminId;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const clearAuthCookies = useCallback(() => {
    document.cookie = 'tm_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'tm_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'tm_admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'impersonating_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'impersonating_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'admin_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  const syncAuthCookies = useCallback(async (token: string, authUser: Pick<User, 'role' | 'email'>) => {
    clearAuthCookies();

    // Set token in local cookie so invokeFunction can find it immediately
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const sameSiteStr = isSecure ? 'SameSite=None; Secure;' : 'SameSite=Lax;';
    
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    let domainStr = '';
    if (host) {
      if (host.includes('localhost')) {
        domainStr = '; domain=.localhost';
      } else if (!host.includes('127.0.0.1')) {
        const domainParts = host.split('.');
        const baseDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : domainParts.join('.');
        domainStr = `; domain=.${baseDomain}`;
      }
    }
    document.cookie = `tm_access_token=${token}; path=/; ${sameSiteStr} max-age=${60 * 60 * 24 * 7}${domainStr}`;

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('tm_token', token);
      
      // Inject token into global insforge SDK to fix 401 Unauthorized errors
      try {
        insforge.setAccessToken(token);
        const mainAuth = insforge.auth as any;
        if (mainAuth.tokenManager) {
          mainAuth.tokenManager.saveSession({ user: authUser, accessToken: token });
        }
      } catch (err) {
        console.warn('Could not inject token into global insforge SDK:', err);
      }
    }

    const adminAccess = authUser.role === 'admin' || authUser.role === 'super_admin';

    // Call the auth-session edge function to set cookies in the function domain
    const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const authEndpoint = typeof window !== 'undefined' ? '/api/v1/remote/functions/auth-session' : `${baseUrl}/functions/auth-session`;
    await fetch(authEndpoint, {
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
    token: string,
    userId: string,
    email: string,
    metadata?: Record<string, unknown>,
  ): Promise<User | null> => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/remote` : (process.env.NEXT_PUBLIC_INSFORGE_URL || '');
      const authEndpoint = typeof window !== 'undefined' ? '/api/v1/remote/functions/auth-session' : `${baseUrl}/functions/auth-session`;
      
      const response = await fetch(authEndpoint, {
        method: 'GET',
        headers: {
          'x-client-info': 'talentmesh-web',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const payload = await response.json();
        if (payload?.user) {
          console.log('[AuthContext] Successfully loaded profile via auth-session edge function');
          return payload.user as User;
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to fetch profile via auth-session edge function, falling back to direct DB fetch:', err);
    }

    try {
      const { createClient } = await import('@insforge/sdk');
      const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/remote` : (process.env.NEXT_PUBLIC_INSFORGE_URL || '');
      const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!;
      const authedClient = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: false });

      const { data: profile, error } = await authedClient.database
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();


      if (error || !profile) {
        const fallbackRole: UserRole = (metadata?.role as UserRole) || 'candidate';
        // Prefer the real name from OAuth metadata (Google sends full_name / name)
        const metadataName = (metadata?.full_name || metadata?.name || '') as string;
        const fallbackName = metadataName.trim() || email.split('@')[0];

        try {
          const { data: createdProfile, error: insertError } = await authedClient.database
            .from('profiles')
            .insert([{
              id: userId,
              email,
              role: fallbackRole,
              name: fallbackName,
            }])
            .select()
            .single();

          if (!insertError && createdProfile) {
            return {
              id: userId,
              email,
              role: createdProfile.role as UserRole,
              name: createdProfile.name || fallbackName,
              avatar_url: createdProfile.avatar_url || null,
              company_id: createdProfile.company_id,
              created_at: createdProfile.created_at,
              mfa_enabled: createdProfile.mfa_enabled || false,
              password_set_at: createdProfile.password_set_at,
              onboarding_completed: createdProfile.completed_onboarding || createdProfile.onboarding_completed || false,
              onboarding_step: createdProfile.onboarding_step || 0,
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
          avatar_url: (metadata?.avatar_url || metadata?.picture || null) as string | null,
          onboarding_completed: false,
          onboarding_step: 0,
        };
      }

      // Prefer profile name from DB; if it looks like an email prefix, try metadata instead
      const dbName = (profile.name || '') as string;
      const metaName = ((metadata?.full_name || metadata?.name || '') as string).trim();
      const resolvedName = (dbName && dbName !== email.split('@')[0]) ? dbName : (metaName || dbName);

      return {
        id: userId,
        email,
        role: (profile.role as UserRole) || 'candidate',
        name: resolvedName,
        avatar_url: profile.avatar_url || null,
        company_id: profile.company_id,
        created_at: profile.created_at,
        mfa_enabled: profile.mfa_enabled || false,
        password_set_at: profile.password_set_at,
        onboarding_completed: profile.completed_onboarding || profile.onboarding_completed || false,
        onboarding_step: profile.onboarding_step || 0,
      };
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);

    try {
      // Proactively rotate/refresh token first to keep session active
      const refreshedToken = await refreshAccessToken();

      // Extract token from session storage or cookies for verification
      let token = refreshedToken;
      if (!token && typeof window !== 'undefined') {
        token = window.sessionStorage.getItem('tm_token');
      }
      if (!token && typeof window !== 'undefined') {
        const match = document.cookie.match(/tm_access_token=([^;]+)/);
        token = match ? match[1] : null;
        if (token && token.startsWith('Bearer%20')) {
          token = decodeURIComponent(token).substring(7);
        }
      }

      const authEndpoint = '/api/v1/remote/functions/auth-session';
      const response = await fetch(authEndpoint, {
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

      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      let domainStr = '';
      if (host) {
        if (host.includes('localhost')) {
          domainStr = '; domain=.localhost';
        } else if (!host.includes('127.0.0.1')) {
          const domainParts = host.split('.');
          const baseDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : domainParts.join('.');
          domainStr = `; domain=.${baseDomain}`;
        }
      }
      document.cookie = `tm_role=${resolvedUser.role}; path=/; SameSite=Lax${domainStr}`;
      if (resolvedUser.role === 'admin' || resolvedUser.role === 'super_admin') {
        document.cookie = `tm_admin_access=true; path=/; SameSite=Lax${domainStr}`;
      }

      // Sync token to local cookie/SDK if we have a token
      const finalToken = payload.token || token;
      if (finalToken) {
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const sameSiteStr = isSecure ? 'SameSite=None; Secure;' : 'SameSite=Lax;';
        document.cookie = `tm_access_token=${finalToken}; path=/; ${sameSiteStr} max-age=${60 * 60 * 24 * 7}`;
        // Also save to sessionStorage so invokeFunction can find it reliably
        window.sessionStorage.setItem('tm_token', finalToken);
        
        // Inject token into global insforge SDK to fix 401 Unauthorized errors
        try {
          insforge.setAccessToken(finalToken);
          const mainAuth = insforge.auth as any;
          if (mainAuth.tokenManager) {
            mainAuth.tokenManager.saveSession({ user: resolvedUser, accessToken: finalToken });
          }
        } catch (err) {}
      }

      // Check impersonation status from cookies
      if (typeof window !== 'undefined') {
        const impId = document.cookie.match(/impersonating_user_id=([^;]+)/)?.[1];
        const impRole = document.cookie.match(/impersonating_user_role=([^;]+)/)?.[1];
        const admId = document.cookie.match(/admin_user_id=([^;]+)/)?.[1];

        if (impId && impRole && admId) {
          setImpersonatedUser({ id: impId, role: impRole });
          setAdminId(admId);
        } else {
          setImpersonatedUser(null);
          setAdminId(null);
        }
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
      setIsInitialized(true);
    }
  }, [cacheUser, clearAuthCookies]);

  const signOut = async () => {
    await insforge.auth.signOut();
    // Call the auth-session edge function to clear cookies
    const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const authEndpoint = typeof window !== 'undefined' ? '/api/v1/remote/functions/auth-session' : `${baseUrl}/functions/auth-session`;
    await fetch(authEndpoint, {
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

      const fullUser = await fetchProfile(data.accessToken, data.user.id, data.user.email, data.user.metadata || undefined);
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
          role: role,
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
    const initAuth = async () => {
      let urlToken: string | null = null;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        urlToken = urlParams.get('token');
        if (urlToken) {
          // Store token in session storage
          window.sessionStorage.setItem('tm_token', urlToken);
          
          // Set cookie for local subdomain context
          const isSecure = window.location.protocol === 'https:';
          const sameSiteStr = isSecure ? 'SameSite=None; Secure;' : 'SameSite=Lax;';
          document.cookie = `tm_access_token=${urlToken}; path=/; ${sameSiteStr} max-age=${60 * 60 * 24 * 7}`;
          
          // Remove the token query param to keep the URL clean
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('token');
          window.history.replaceState({}, '', newUrl.toString());
        }
      }

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

      const hasAccessToken = urlToken || document.cookie.includes('tm_access_token');
      const isAuthPage = typeof window !== 'undefined' &&
        (window.location.pathname === '/auth/callback' || window.location.pathname === '/login');

      if ((hasLoadedCached || hasAccessToken) && !isAuthPage) {
        await refreshUser();
      } else {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [refreshUser]);

  // 🔥 Listen for session-expired events from invokeFunction
  useEffect(() => {
    const handleExpiry = () => {
      console.warn('[AuthContext] Session expired event received. Signing out...');
      signOut();
      router.push('/login?reason=session_expired');
    };

    window.addEventListener('auth:session-expired', handleExpiry);
    return () => window.removeEventListener('auth:session-expired', handleExpiry);
  }, [signOut, router]);

  // 🔥 Auth state is handled via proactive refresh and manual sign out calls.
  // InsForge SDK does not provide a separate onAuthStateChange listener like Supabase.



  const login = useCallback(async (token: string, authUser: User) => {
    await syncAuthCookies(token, authUser);
    setUser(authUser);
    cacheUser(authUser);
  }, [cacheUser, syncAuthCookies]);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isLoading,
      isInitialized,
      signIn,
      signUp,
      signOut,
      logout: signOut,
      refreshUser,
      login,
      isImpersonating,
      impersonatedUser,
      adminId
    }}>
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
