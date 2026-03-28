"use client";
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { insforge } from '@/lib/insforge';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role'); // Get role from query param (?role=recruiter)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Trigger a session refresh to pick up the OAuth tokens
        const { data: session, error } = await insforge.auth.refreshSession();
        
        if (error) {
          console.error('Session retrieval error:', error.message);
          router.push('/login?error=session_fetch_failed');
          return;
        }

        if (!session) {
          // Fallback if session is missing after a short delay
          setTimeout(async () => {
            const { data: retrySession } = await insforge.auth.refreshSession();
            if (!retrySession) {
              router.push('/login?error=no_session');
            } else {
              processSession(retrySession);
            }
          }, 1500);
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

      // Extract metadata provided by the provider (Google/LinkedIn)
      const profileInfo = user.profile || {};
      const metadataInfo = user.metadata || {};
      const identityData = user.identities?.[0]?.identity_data || {};

      const realName =
        profileInfo.name ||
        metadataInfo.full_name ||
        metadataInfo.name ||
        identityData.full_name ||
        identityData.name ||
        (user.email ?? '').split('@')[0] || 'User';

      const avatarUrl =
        profileInfo.avatar_url ||
        metadataInfo.avatar_url ||
        metadataInfo.picture ||
        identityData.avatar_url ||
        identityData.picture ||
        null;

      // Fetch existing profile to determine role and onboarding status
      const { data: existingProfile } = await insforge.database
        .from('profiles')
        .select('role, role_id, completed_onboarding')
        .eq('id', user.id)
        .single();

      const finalRole = existingProfile?.role || defaultRole || 'candidate';

      // Generate role-specific ID if not exists
      let roleId = existingProfile?.role_id;
      if (!roleId) {
        const prefix = finalRole === 'super_admin' ? 'admin' : finalRole === 'recruiter' ? 'recr' : 'cand';
        roleId = `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
      }

      // Upsert profile
      const { error: profileError } = await insforge.database
        .from('profiles')
        .upsert([{
          id: user.id,
          email: user.email,
          name: realName,
          avatar_url: avatarUrl,
          role: finalRole,
          role_id: roleId,
          completed_onboarding: existingProfile?.completed_onboarding ?? false,
          updated_at: new Date().toISOString(),
        }]);

      if (profileError) {
        console.error('Profile save error:', profileError.message);
      }

      // Ensure candidate profile exists
      if (finalRole === 'candidate') {
        await insforge.database
          .from('candidate_profiles')
          .upsert([{ id: user.id }]);
      }

      // Set cookies for middleware
      document.cookie = 'tm_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'tm_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = `tm_access_token=${session.accessToken}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `tm_role=${finalRole}; path=/; max-age=3600; SameSite=Lax`;

      if (finalRole === 'admin' || finalRole === 'super_admin') {
        document.cookie = 'tm_admin_access=true; path=/; max-age=3600; SameSite=Lax';
      }

      // --- Role-based routing ---
      if (finalRole === 'admin' || finalRole === 'super_admin') {
        window.location.assign('/dashboard/admin');
        return;
      }

      if (finalRole === 'recruiter') {
        if (existingProfile?.completed_onboarding) {
          window.location.assign('/dashboard/recruiter');
        } else {
          window.location.assign('/onboarding/recruiter/setup');
        }
        return;
      }

      // For candidates: check onboarding
      if (existingProfile?.completed_onboarding) {
        const dashboardRoleId = existingProfile?.role_id || roleId;
        window.location.assign(`/dashboard/candidate/${dashboardRoleId}`);
      } else {
        window.location.assign('/onboarding/candidate');
      }
    };

    handleCallback();
  }, [router, defaultRole]);

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