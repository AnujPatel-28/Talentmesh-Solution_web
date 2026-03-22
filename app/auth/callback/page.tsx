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
      // 1. Trigger a session refresh to pick up the OAuth tokens
      const { data: { session } } = await insforge.auth.getCurrentSession();

      if (!session) {
        // Fallback if session is missing after a short delay
        setTimeout(async () => {
          const { data: { session: retrySession } } = await insforge.auth.getCurrentSession();
          if (!retrySession) {
            router.push('/login');
          } else {
            processSession(retrySession);
          }
        }, 1000);
        return;
      }

      processSession(session);
    };

    const processSession = async (session: { user: any; accessToken: string }) => {
      const user = session.user;

      // Extract metadata provided by the provider (Google/LinkedIn)
      // InsForge maps provider-specific data to user.profile and user.metadata
      const profileInfo = user.profile || {};
      const metadataInfo = user.metadata || {};
      const identityData = user.identities?.[0]?.identity_data || {};

      const realName =
        profileInfo.name ||
        metadataInfo.full_name ||
        metadataInfo.name ||
        identityData.full_name ||
        identityData.name ||
        split_part(user.email, '@', 1);

      const avatarUrl =
        profileInfo.avatar_url ||
        metadataInfo.avatar_url ||
        metadataInfo.picture ||
        identityData.avatar_url ||
        identityData.picture ||
        null;

      // Update the profile row with the latest data from the provider
      // We also set the role from the query param if it's provided and not yet set in DB
      const { data: existingProfile } = await insforge.database
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const finalRole = existingProfile?.role || defaultRole || 'candidate';

      await insforge.database
        .from('profiles')
        .update({
          name: realName,
          avatar_url: avatarUrl,
          role: finalRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Set cookies immediately for middleware
      // First clear any existing session cookies to avoid duplicates
      document.cookie = 'tm_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'tm_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      document.cookie = `tm_access_token=${session.accessToken}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `tm_role=${finalRole}; path=/; max-age=3600; SameSite=Lax`;

      // Redirect based on the final role
      if (finalRole === 'admin' || finalRole === 'super_admin') router.push('/dashboard/admin');
      else if (finalRole === 'recruiter') router.push('/onboarding/recruiter/setup');
      else router.push('/dashboard/candidate');
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

function split_part(str: string, delim: string, idx: number): string {
  return (str ?? '').split(delim)[idx - 1] ?? '';
}

