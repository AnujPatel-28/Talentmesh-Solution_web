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
        .select('role, role_id')
        .eq('id', user.id)
        .single();

      const finalRole = existingProfile?.role || defaultRole || 'candidate';

      // Generate role-specific ID if not exists
      let roleId = existingProfile?.role_id;
      if (!roleId) {
        const prefix = finalRole === 'super_admin' ? 'admin' : finalRole === 'recruiter' ? 'recr' : 'cand';
        roleId = `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
      }

      const { error: upsertError } = await insforge.database
        .from('profiles')
        .upsert([{
          id: user.id,
          email: user.email,
          name: realName,
          avatar_url: avatarUrl,
          role: finalRole,
          // role_id: roleId, // Omit to avoid "column not found" error
          updated_at: new Date().toISOString(),
        }]);

      if (upsertError) {
        // Handle orphaned profile unique constraint failures (when user deleted in Auth but not Public.Profiles)
        if (upsertError.message.includes('duplicate key') || upsertError.message.includes('unique constraint')) {
          console.log('Resolving orphaned profile conflict for:', user.email);
          await insforge.database.from('profiles').delete().eq('email', user.email);

          await insforge.database
            .from('profiles')
            .upsert([{
              id: user.id,
              email: user.email,
              name: realName,
              avatar_url: avatarUrl,
              role: finalRole,
              // role_id: roleId,
              updated_at: new Date().toISOString(),
            }]);
        } else {
          console.error('Profile Creation Error:', upsertError.message);
        }
      }

      // Set cookies immediately for middleware
      // First clear any existing session cookies to avoid duplicates
      document.cookie = 'tm_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'tm_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      document.cookie = `tm_access_token=${session.accessToken}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `tm_role=${finalRole}; path=/; max-age=3600; SameSite=Lax`;
      // Use full page redirect to ensure AuthContext picks up new cookies/session
      if (finalRole === 'admin' || finalRole === 'super_admin') {
        window.location.assign('/dashboard/admin');
      } else if (finalRole === 'recruiter') {
        window.location.assign('/onboarding/recruiter/setup');
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

function split_part(str: string, delim: string, idx: number): string {
  return (str ?? '').split(delim)[idx - 1] ?? '';
}
