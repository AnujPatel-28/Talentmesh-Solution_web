"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();

  useEffect(() => {
    // 1. Trigger a session refresh to pick up the OAuth tokens from URL/cookies
    const handleAuth = async () => {
      await refreshUser();
    };
    handleAuth();
  }, [refreshUser]);

  useEffect(() => {
    // 2. Once user is loaded, handle role assignment and then redirect
    if (!isLoading) {
      const handleRoleAndRedirect = async () => {
        if (user) {
          const searchParams = new URLSearchParams(window.location.search);
          const queryRole = searchParams.get('role');

          if (queryRole) {
            const finalRole = queryRole === 'employer' ? 'recruiter' : 'candidate';
            // Only update if it's different to avoid unnecessary writes
            if (user.role !== finalRole) {
              await insforge.database
                .from('profiles')
                .update({ role: finalRole })
                .eq('id', user.id);
            }
          }

          if (user.role === 'super_admin' || user.role === 'super_admin' as any) {
            router.push('/dashboard/admin');
          } else if (user.role === 'recruiter' || (queryRole === 'employer')) {
            router.push('/dashboard/recruiter');
          } else {
            router.push('/dashboard/candidate');
          }
        } else {
          // If no user after loading, go back to login
          router.push('/login');
        }
      };

      handleRoleAndRedirect();
    }
  }, [user, isLoading, router]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }} />
      <h1 style={{ fontSize: '1.25rem', fontWeight: 500 }}>Signing you in...</h1>
      <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Please wait while we set up your session.</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
