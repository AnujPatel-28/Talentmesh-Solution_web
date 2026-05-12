"use client";
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { insforge, getSession } from '@/lib/insforge';

import { useAuth } from '@/lib/auth/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const defaultRole = searchParams.get('role');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Wait for OAuth callback processing to complete first
        // getCurrentUser() internally awaits the insforge_code exchange
        await insforge.auth.getCurrentUser();

        // 2. Refresh the session using the httpOnly cookie
        let session = await getSession();

        // 3. Handle potential CSRF or initial failure
        if (!session) {
          console.warn('Initial session refresh failed, retrying once...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          session = await getSession();
        }

        if (!session) {
          console.error('Session retrieval error: No session returned after refresh.');
          router.push('/login?error=session_fetch_failed');
          return;
        }

        processSession(session);
      } catch (err) {
        console.error('Unexpected callback error:', err);
        router.push('/login?error=callback_error');
      }
    };

    const processSession = async (session: { user: any; accessToken: string }) => {
      const user = session.user;

      // ... profile extraction logic ...
      const metadataInfo = user.metadata || {};
      const identityData = user.identities?.[0]?.identity_data || {};

      const realName =
        metadataInfo.full_name ||
        metadataInfo.name ||
        identityData.full_name ||
        identityData.name ||
        (user.email ?? '').split('@')[0] || 'User';

      const avatarUrl =
        metadataInfo.avatar_url ||
        metadataInfo.picture ||
        identityData.avatar_url ||
        identityData.picture ||
        null;

      // Fetch existing profile
      const { data: existingProfile } = await insforge.database
        .from('profiles')
        .select('name, role, role_id, completed_onboarding')
        .eq('id', user.id)
        .single();

      const finalRole = existingProfile?.role || defaultRole || 'candidate';

      let roleId = existingProfile?.role_id;
      if (!roleId) {
        const prefix = finalRole === 'super_admin' ? 'admin' : finalRole === 'recruiter' ? 'recr' : 'cand';
        roleId = `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
      }

      const finalName = existingProfile ? (existingProfile.name || realName) : "";

      await insforge.database
        .from('profiles')
        .upsert([{
          id: user.id,
          email: user.email,
          name: finalName,
          avatar_url: avatarUrl,
          role: finalRole,
          role_id: roleId,
          completed_onboarding: existingProfile?.completed_onboarding ?? false,
          updated_at: new Date().toISOString(),
        }]);

      if (finalRole === 'candidate') {
        await insforge.database
          .from('candidate_profiles')
          .upsert([{ id: user.id }]);
      }

      // 🛡️ SECURE LOGIN HANDOFF
      // This uses our new HttpOnly secure session API internally
      await login(session.accessToken, {
        id: user.id,
        email: user.email!,
        name: realName,
        role: finalRole as any,
        avatar_url: avatarUrl,
        role_id: roleId,
      });

      // --- Role-based routing ---
      if (finalRole === 'admin' || finalRole === 'super_admin') {
        router.replace('/dashboard/admin');
        return;
      }

      if (finalRole === 'recruiter') {
        router.replace(existingProfile?.completed_onboarding ? '/dashboard/recruiter' : '/onboarding/recruiter/setup');
        return;
      }

      router.replace(existingProfile?.completed_onboarding ? `/dashboard/candidate/${roleId}` : '/onboarding/candidate');
    };

    handleCallback();
  }, [router, defaultRole, login]);


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0c0c14',
      color: '#e2e2f0',
      fontFamily: 'sans-serif',
      gap: '12px'
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" style={{ animation: 'spin 2s linear infinite' }}>
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
      </svg>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      Signing you in...
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}