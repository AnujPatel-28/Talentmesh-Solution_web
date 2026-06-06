"use client";
import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { insforge, getSession } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { getMyProfile } from '@/lib/api/profile';
import { createClient } from '@insforge/sdk';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const defaultRole = searchParams.get('role');

  // Loading states: 'authenticating' (fetching sesssion) -> 'fetching_profile' (fetching DB profile) -> 'redirecting'
  const [loadingState, setLoadingState] = useState<'authenticating' | 'fetching_profile' | 'redirecting' | 'error'>('authenticating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoadingState('authenticating');
        // 1. Wait for OAuth callback processing to complete first using the main insforge client
        await insforge.auth.getCurrentUser();

        // 2. Get the session from the SDK's internal TokenManager
        const authAny = insforge.auth as any;
        let session = authAny.tokenManager?.getSession() || null;

        // 3. Handle potential CSRF or initial failure with robust fallbacks
        if (!session) {
          console.warn('Initial session fetch failed, attempting explicit refreshSession...');

          // Fallback A: Try refreshing the session via our custom proxy refresh helper
          const { refreshAccessToken } = await import('@/lib/insforge');
          const newToken = await refreshAccessToken();
          if (newToken) {
            const { data: userData } = await insforge.auth.getCurrentUser();
            if (userData?.user) {
              session = { user: userData.user, accessToken: newToken };
            }
          }

          // Fallback B: Extract from URL hash (Magic Link / Implicit flow)
          if (!session && typeof window !== 'undefined' && window.location.hash) {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const hashAccessToken = params.get('access_token');
            if (hashAccessToken) {
              const { data: userData } = await insforge.auth.getCurrentUser();
              if (userData?.user) {
                session = { user: userData.user, accessToken: hashAccessToken };
              }
            }
          }


          // Fallback C: Explicitly exchange the OAuth code if it's in the URL
          if (!session && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            const code = url.searchParams.get('insforge_code') || url.searchParams.get('code');
            if (code) {
              console.warn('Manually exchanging OAuth code via Next.js proxy...');

              // We MUST hit our Next.js proxy exactly at /api/auth/oauth/exchange
              // Otherwise, the backend sets cookies that the browser blocks due to cross-origin policies.
              try {
                const proxyRes = await fetch('/api/auth/oauth/exchange', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code }),
                });

                if (proxyRes.ok) {
                  const exchangeData = await proxyRes.json();
                  console.log('Exchange data via proxy:', exchangeData);

                  const token = exchangeData.accessToken || exchangeData.access_token;
                  const user = exchangeData.user || exchangeData.data?.user;

                  if (token && user) {
                    session = { user, accessToken: token };
                    // Save to the main SDK TokenManager
                    const mainAuth = insforge.auth as any;
                    if (mainAuth.tokenManager) {
                      mainAuth.tokenManager.saveSession(session);
                      if (mainAuth.http?.setAuthToken) {
                        mainAuth.http.setAuthToken(token);
                      }
                    }
                  } else {
                    console.error('Exchange succeeded but token/user is missing from response payload!');
                  }
                } else {
                  console.error('Exchange error:', await proxyRes.text());
                }
              } catch (err) {
                console.error('Network error during exchange:', err);
              }
            }
          }
        }

        if (!session) {
          console.error('Session retrieval error: No session returned after refresh.');
          setErrorMessage('Session retrieval failed.');
          setLoadingState('error');
          router.push('/login?error=session_fetch_failed');
          return;
        }

        setLoadingState('fetching_profile');

        await processSession({
          user: session.user,
          accessToken: session.accessToken
        });
      } catch (err) {
        console.error('Unexpected callback error:', err);
        setErrorMessage('Authentication callback failed.');
        setLoadingState('error');
        router.push('/login?error=callback_error');
      }
    };

    const processSession = async (session: { user: any; accessToken: string }) => {
      const user = session.user;

      if (!user) {
        throw new Error("No user found in session");
      }

      // Extract metadata / identity info
      const metadataInfo = user.user_metadata || user.metadata || {};
      const identityData = user.identities?.[0]?.identity_data || {};

      const rawName =
        metadataInfo.full_name ||
        metadataInfo.name ||
        identityData.full_name ||
        identityData.name ||
        (metadataInfo.given_name && metadataInfo.family_name
          ? `${metadataInfo.given_name} ${metadataInfo.family_name}`
          : '') ||
        (metadataInfo.given_name || '') ||
        (metadataInfo.family_name || '') ||
        (user.email ?? '').split('@')[0] ||
        'User';
      const realName = rawName.trim();

      const avatarUrl =
        metadataInfo.avatar_url ||
        metadataInfo.picture ||
        identityData.avatar_url ||
        identityData.picture ||
        null;

      // Await profile fetch
      let existingProfile = null;
      try {
        const profile = await getMyProfile(session.accessToken, false);
        if (profile && profile.id === user.id) {
          existingProfile = profile;
        }
      } catch (err) {
        console.warn('Error fetching profile in callback:', err);
      }

      let detectedRole = defaultRole;
      if (!detectedRole && typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host.startsWith('app.')) detectedRole = 'recruiter';
        else if (host.startsWith('jobs.')) detectedRole = 'candidate';
      }

      let finalRole = existingProfile?.role || detectedRole || 'candidate';

      // Prevent privilege escalation: only allow 'candidate' or 'recruiter' for new accounts via OAuth
      if (!existingProfile?.role && (finalRole === 'admin' || finalRole === 'super_admin')) {
        finalRole = 'candidate';
      }

      let roleId = existingProfile?.role_id;
      if (!roleId) {
        const prefix = finalRole === 'super_admin' ? 'admin' : finalRole === 'recruiter' ? 'recr' : 'cand';
        roleId = `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
      }

      const emailPrefix = (user.email ?? '').split('@')[0];
      const isFallbackName = !existingProfile?.name || existingProfile.name === emailPrefix;
      const finalName = (isFallbackName && realName !== emailPrefix) ? realName : (existingProfile?.name || realName);

      // Check onboarding status
      const onboardingComplete =
        existingProfile?.onboarding_complete === true ||
        existingProfile?.completed_onboarding === true ||
        existingProfile?.onboarding_completed === true ||
        existingProfile?.is_onboarded === true;

      const finalAvatarUrl = existingProfile?.avatar_url || avatarUrl;

      const { error: profileUpsertError } = await insforge.database
        .from('profiles')
        .upsert([{
          id: user.id,
          email: user.email,
          name: finalName,
          avatar_url: finalAvatarUrl,
          role: finalRole,
          role_id: roleId,
          completed_onboarding: onboardingComplete,
          updated_at: new Date().toISOString(),
        }]);

      if (profileUpsertError) {
        console.error('[auth-callback] Error upserting profile:', profileUpsertError.message);
      }

      if (finalRole === 'candidate') {
        const { error: candidateUpsertError } = await insforge.database
          .from('candidate_profiles')
          .upsert([{ id: user.id }]);
        if (candidateUpsertError) {
          console.error('[auth-callback] Error upserting candidate profile:', candidateUpsertError.message);
        }
      }

      // 🛡️ SECURE LOGIN HANDOFF
      // This uses our new HttpOnly secure session API internally
      await login(session.accessToken, {
        id: user.id,
        email: user.email!,
        name: realName,
        role: finalRole as any,
        avatar_url: finalAvatarUrl,
        role_id: roleId,
      });

      setLoadingState('redirecting');

      // (4) Route to onboarding if profile doesn't exist or onboarding isn't complete
      if (!existingProfile || !onboardingComplete) {
        if (finalRole === 'recruiter') {
          router.replace('/onboarding/recruiter/setup');
        } else if (finalRole === 'admin' || finalRole === 'super_admin') {
          // Admins don't have onboarding, just go to dashboard
          router.replace('/admin/dashboard');
        } else {
          router.replace('/onboarding/candidate');
        }
        return;
      }

      // (3) route based on role: admin → /admin/dashboard, recruiter → /recruiter/dashboard, candidate → /candidate/dashboard
      if (finalRole === 'admin' || finalRole === 'super_admin') {
        router.replace('/admin/dashboard');
        return;
      }

      if (finalRole === 'recruiter') {
        router.replace('/recruiter/dashboard');
        return;
      }

      router.replace('/candidate/dashboard');
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
      {loadingState !== 'error' && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" style={{ animation: 'spin 2s linear infinite' }}>
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        </svg>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {loadingState === 'authenticating' && 'Signing you in...'}
      {loadingState === 'fetching_profile' && 'Loading your profile...'}
      {loadingState === 'redirecting' && 'Redirecting to your dashboard...'}
      {loadingState === 'error' && (errorMessage || 'Signing in failed. Please try again.')}
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0c0c14',
        color: '#e2e2f0',
        fontFamily: 'sans-serif'
      }}>
        Loading...
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}