import { createClient } from '@insforge/sdk';
import { User } from '@/types/auth';
import { getServerStorageUrl } from '@/lib/utils/storage-url';
import { startTrace, endTrace } from './observability';
import { TIMEOUTS } from './requestTimeout';

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('CRITICAL ERROR: Missing environment variable NEXT_PUBLIC_INSFORGE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('CRITICAL ERROR: Missing environment variable NEXT_PUBLIC_INSFORGE_ANON_KEY');
}

// Extract and store any pending OAuth code in the browser before the SDK client instantiations run.
// This prevents SDK clients from automatically detecting the query param and initiating a direct code exchange
// that bypasses our custom Next.js secure cookie proxy endpoint (/api/auth/oauth/exchange).
// We intercept both `insforge_code` (InsForge SDK's renamed callback param) and plain `code`
// (standard OAuth) so the SDK never auto-consumes them. Without this, the SDK may exchange the
// code via /api/v1/remote which skips setting the custom `tm_access_token` HttpOnly cookie.
let oauthCode: string | null = null;
if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
  const params = new URLSearchParams(window.location.search);
  const insforgeCode = params.get('insforge_code');
  const plainCode = params.get('code');
  const code = insforgeCode || plainCode;
  if (code) {
    oauthCode = code;
    if (insforgeCode) params.delete('insforge_code');
    if (plainCode) params.delete('code');
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  }
}

export const pendingOAuthCode = oauthCode;

// Client containing the anon key, safe for both client and server pages
export const insforge = createClient({
  baseUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/v1/remote` : supabaseUrl,
  anonKey: supabaseAnonKey,
});

/**
 * Direct client that bypasses the local proxy.
 * Use for direct queries (like WebSockets or fallback requests) where the proxy is bypassed.
 * Set `isServerMode: true` on the browser to completely prevent automatic callback detection and token persistence.
 */
export const directInsforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: supabaseAnonKey,
  isServerMode: true,
});

/**
 * Public-only client that never holds a user session token.
 * Use this for anonymous public fetches (like blogs) to ensure they never fail due to expired session tokens.
 */
export const publicInsforge = createClient({
  baseUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/v1/remote` : supabaseUrl,
  anonKey: typeof window !== 'undefined' ? supabaseAnonKey : (process.env.INSFORGE_SERVICE_KEY || supabaseAnonKey),
  isServerMode: true,
});

if (typeof window !== 'undefined') {
  try {
    // Explicitly override baseUrl in the browser to prevent any SSR-leak of the remote URL
    const localBaseUrl = `${window.location.origin}/api/v1/remote`;
    (insforge as any).baseUrl = localBaseUrl;
    if ((insforge as any).http) {
      (insforge as any).http.baseUrl = localBaseUrl;
    }

    const token = window.sessionStorage.getItem('tm_token');
    const isJwt = token && token.split('.').length === 3;
    if (isJwt && getTokenRemainingSeconds(token) > 0) {
      insforge.setAccessToken(token);
      directInsforge.setAccessToken(token);
      if (directInsforge.realtime && typeof (directInsforge.realtime as any).setAuth === 'function') {
        (directInsforge.realtime as any).setAuth(token);
      }
    }
  } catch (err) {
    console.warn('Failed to auto-restore access token from sessionStorage:', err);
  }
}

function getBrowserRole(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const cached = window.sessionStorage.getItem('tm_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.role) return parsed.role;
    }
  } catch (e) { }
  const match = document.cookie.match(/tm_role=([^;]+)/);
  if (match) return match[1];
  return undefined;
}

/**
 * Helper to invoke Edge Functions manually to bypass SDK URL construction bug.
 */
export async function invokeFunction(slug: string, options: {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  queries?: Record<string, string | undefined>;
  path?: string;
  timeoutMs?: number;
  idempotencyKey?: string;
  signal?: AbortSignal;
} = {}) {
  const { method = 'POST', body, headers = {}, queries = {}, path = '' } = options;
  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? `${window.location.origin}/api/v1/remote` : (process.env.NEXT_PUBLIC_INSFORGE_URL || '');

  // Determine request-specific timeout
  const timeoutMs = options.timeoutMs || (
    slug.includes('dashboard') ? TIMEOUTS.DASHBOARD :
      slug.includes('candidate') ? TIMEOUTS.CANDIDATES :
        slug.includes('reports') ? TIMEOUTS.REPORTS :
          slug.includes('settings') ? TIMEOUTS.SETTINGS :
            (slug.includes('approve') || slug.includes('job')) ? TIMEOUTS.APPROVE :
              30000
  );

  const role = getBrowserRole();
  const trace = startTrace(slug, role);

  // Construct URL with path and queries
  let url = `${baseUrl}/functions/${slug}${path}`;
  const queryParams = new URLSearchParams();
  Object.entries(queries).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  // Resolve auth token: caller-supplied header > sessionStorage (primary, survives navigation) > cookie
  let authHeader = headers['Authorization'] || headers['authorization'];

  if (!authHeader && typeof window !== 'undefined') {
    // 1. sessionStorage — always accessible, set by syncAuthCookies after login
    const stored = window.sessionStorage.getItem('tm_token');
    if (stored) {
      authHeader = `Bearer ${stored}`;
    } else {
      // 2. Cookie fallback (works on HTTPS or after SameSite=Lax is applied)
      const cookieArr = document.cookie.split(';');
      for (let i = 0; i < cookieArr.length; i++) {
        const cookie = cookieArr[i].trim();
        if (cookie.startsWith('tm_access_token=')) {
          const token = cookie.substring('tm_access_token='.length);
          if (token) {
            const decodedToken = token.startsWith('Bearer%20')
              ? decodeURIComponent(token).substring(7)
              : token;
            authHeader = `Bearer ${decodedToken}`;
            break;
          }
        }
      }
    }
  }

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-info': 'talentmesh-web',
    'x-request-id': trace.requestId,
    'x-trace-id': trace.traceId,
    ...headers
  };

  if (authHeader) {
    finalHeaders['Authorization'] = authHeader;
  }

  if (options.idempotencyKey) {
    finalHeaders['x-idempotency-key'] = options.idempotencyKey;
  }

  // GET requests cannot have a body
  // For public GET requests, we omit credentials to avoid CORS conflicts with wildcard origins
  const fetchOptions: RequestInit = {
    method,
    headers: finalHeaders,
    credentials: (method === 'GET' && !authHeader) ? 'omit' : 'include',
  };

  if (method !== 'GET' && body) {
    fetchOptions.body = JSON.stringify(body);
  }

  // Block mutations during impersonation for security
  if (typeof window !== 'undefined' && method !== 'GET') {
    const isImpersonating = document.cookie.includes('tm_impersonating_user_id=');
    if (isImpersonating) {
      console.warn('Mutation blocked: You are in READ-ONLY impersonation mode.');
      endTrace(trace, 'error', 'Blocked by read-only impersonation');
      return {
        data: null,
        error: {
          message: 'Action blocked: You are in read-only impersonation mode. Please exit impersonation to perform this action.',
          status: 403
        }
      };
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let abortHandler: (() => void) | null = null;
  if (options.signal) {
    const parentSignal = options.signal;
    if (parentSignal.aborted) {
      controller.abort(parentSignal.reason);
      clearTimeout(timeoutId);
    } else {
      abortHandler = () => {
        controller.abort(parentSignal.reason);
        clearTimeout(timeoutId);
      };
      parentSignal.addEventListener('abort', abortHandler);
    }
  }

  fetchOptions.signal = controller.signal;

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryHeaders = {
          ...finalHeaders,
          'Authorization': `Bearer ${newToken}`
        };
        const retryOptions = { ...fetchOptions, headers: retryHeaders };
        const retryResponse = await fetch(url, retryOptions);
        // Always use retryResponse, regardless of status
        response = retryResponse;
      } else {
        // Refresh failed — session is truly dead
        console.warn('[invokeFunction] Token refresh failed (session expired). Dispatching session-expiry.');
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        endTrace(trace, 'error', 'Session expired');
        return { data: null, error: { message: 'Session expired', status: 401 } };
      }
    }
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('abort');
    if (isAbort) {
      if (options.signal && options.signal.aborted) {
        throw err;
      }
      endTrace(trace, 'timeout', `Request timed out after ${timeoutMs}ms`);
      return { data: null, error: { message: 'Request timed out — please try again.', status: 408 } };
    }
    endTrace(trace, 'error', err?.message || 'Network error');
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (options.signal && abortHandler) {
      options.signal.removeEventListener('abort', abortHandler);
    }
  }

  if (!response.ok) {
    let errorMessage = response.statusText;
    let errorDetails: any = null;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      errorDetails = errorData.details || null;
      if (errorDetails) {
        console.error(`[invokeFunction] ${slug} validation details:`, JSON.stringify(errorDetails, null, 2));
      }
    } catch (e) {
      // Not JSON, likely HTML error page
    }
    endTrace(trace, 'error', errorMessage);
    return { data: null, error: { message: errorMessage, status: response.status, details: errorDetails } };
  }

  try {
    const text = await response.text();
    if (!text) {
      endTrace(trace, 'success');
      return { data: null, error: null };
    }
    const data = JSON.parse(text);
    endTrace(trace, 'success');
    return { data, error: null };
  } catch (err) {
    console.error('Failed to parse response as JSON:', err);
    endTrace(trace, 'error', 'JSON parse error');
    return { data: null, error: { message: 'Unexpected response format from server', status: response.status } };
  }
}

/**
 * Decode a JWT and return seconds until expiry (negative if already expired).
 */
export function getTokenRemainingSeconds(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return 0;
    return payload.exp - Math.floor(Date.now() / 1000);
  } catch {
    return 0;
  }
}

/**
 * Helper to persist the rotated CSRF token to both sessionStorage and the cookie
 * so that all subsequent refresh calls stay in sync.
 */
function saveCsrfToken(csrf: string): void {
  if (typeof window === 'undefined') return;
  const maxAge = 7 * 24 * 60 * 60;
  // Write with path=/ so it is accessible from any page via document.cookie
  document.cookie = `insforge_csrf_token=${encodeURIComponent(csrf)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Helper to retrieve the most up-to-date CSRF token.
 * Checks sessionStorage FIRST (updated after every successful refresh),
 * then falls back to the insforge_csrf_token cookie (set by the SDK during OAuth).
 */
function getCsrfToken(): string {
  // Cookie fallback (initial value set by SDK during OAuth code exchange)
  if (typeof document !== 'undefined') {
    const match = document.cookie.split(';').find((c) => c.trim().startsWith('insforge_csrf_token='));
    if (match) {
      const val = match.split('=').slice(1).join('=').trim();
      if (val) {
        try { return decodeURIComponent(val); } catch { return val; }
      }
    }
  }
  return '';
}

let activeRefreshPromise: Promise<string | null> | null = null;

function getActiveRefreshPromise(): Promise<string | null> | null {
  if (typeof window !== 'undefined') {
    const globalAny = window as any;
    if (globalAny.__activeRefreshPromise) {
      return globalAny.__activeRefreshPromise;
    }
  }
  return activeRefreshPromise;
}

function setActiveRefreshPromise(promise: Promise<string | null> | null): void {
  activeRefreshPromise = promise;
  if (typeof window !== 'undefined') {
    const globalAny = window as any;
    globalAny.__activeRefreshPromise = promise;
  }
}

/**
 * Refresh the access token using the InsForge httpOnly refresh cookie
 * (set by the Next.js proxy when the login response forwarded InsForge's Set-Cookie).
 * Returns the new accessToken, or null if refresh failed.
 */
export async function refreshAccessToken(): Promise<string | null> {
  // Proactively check if the existing token is still valid (has > 60s remaining)
  let currentToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('tm_token') : null;
  if (!currentToken && typeof document !== 'undefined') {
    const match = document.cookie.split(';').find((c) => c.trim().startsWith('tm_access_token='));
    if (match) {
      const val = match.split('=').slice(1).join('=').trim();
      if (val) {
        currentToken = val.startsWith('Bearer%20') ? decodeURIComponent(val).substring(7) : val;
      }
    }
  }

  if (currentToken) {
    const remaining = getTokenRemainingSeconds(currentToken);
    if (remaining > 60) {
      return currentToken;
    }
  }

  const currentPromise = getActiveRefreshPromise();
  if (currentPromise) {
    return currentPromise;
  }

  const newPromise = (async () => {
    try {
      // Use the custom Next.js proxy at /api/auth/refresh.
      // The insforge_refresh_token cookie has Path=/api/auth, so the browser sends it
      // to requests under /api/auth — this route matches. The old /api/v1/remote path
      // did NOT match and the cookie was never forwarded, causing every refresh to 401.
      const url = typeof window !== 'undefined'
        ? `${window.location.origin}/api/auth/refresh`
        : `${process.env.NEXT_PUBLIC_INSFORGE_URL}/api/auth/refresh`;
      const csrfToken = getCsrfToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
      });
      if (!response.ok) return null;
      const data = await response.json();
      const newToken: string | null = data?.accessToken ?? null;
      if (newToken && typeof window !== 'undefined') {
        // Persist rotated CSRF so next call uses the updated token
        if (data?.csrfToken) saveCsrfToken(data.csrfToken);
        window.sessionStorage.setItem('tm_token', newToken);
        const isSecure = window.location.protocol === 'https:';
        const sameSite = isSecure ? 'SameSite=None; Secure;' : 'SameSite=Lax;';

        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        let domainStr = '';
        if (host) {
          if (host.includes('localhost')) {
            domainStr = '';
          } else if (!host.includes('127.0.0.1')) {
            const domainParts = host.split('.');
            const baseDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : domainParts.join('.');
            domainStr = `; domain=.${baseDomain}`;
          }
        }
        document.cookie = `tm_access_token=${newToken}; path=/; ${sameSite} max-age=${60 * 60 * 24 * 7}${domainStr}`;

        // Synchronize refreshed token with active browser SDK client for direct queries
        const isJwt = newToken && newToken.split('.').length === 3;
        if (isJwt) {
          insforge.setAccessToken(newToken);
          directInsforge.setAccessToken(newToken);
          if (directInsforge.realtime && typeof (directInsforge.realtime as any).setAuth === 'function') {
            (directInsforge.realtime as any).setAuth(newToken);
          }
        }

        // Broadcast session refresh to other open tabs to prevent duplicate refresh requests
        try {
          const { broadcastSessionEvent } = await import('@/lib/sessionSync');
          broadcastSessionEvent('SESSION_REFRESHED', {
            token: newToken,
            user: data?.user,
            csrfToken: data?.csrfToken
          });
        } catch (syncErr) {
          console.warn('Failed to broadcast token refresh:', syncErr);
        }
      }
      return newToken;
    } catch {
      return null;
    } finally {
      setActiveRefreshPromise(null);
    }
  })();

  setActiveRefreshPromise(newPromise);
  return newPromise;
}

/**
 * Helper to fetch the current active session via the proxy (avoids SDK's hardcoded /api/auth/refresh path).
 */
export async function getSession() {
  try {
    // Use the custom Next.js proxy at /api/auth/refresh (matches cookie Path=/api/auth)
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth/refresh`
      : `${process.env.NEXT_PUBLIC_INSFORGE_URL}/api/auth/refresh`;
    const csrfToken = getCsrfToken();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json();
    // Persist rotated CSRF token so future calls (including invokeFunction retry) use the new value
    if (data?.csrfToken && typeof window !== 'undefined') {
      saveCsrfToken(data.csrfToken);
    }
    return data || null;
  } catch {
    return null;
  }
}

/**
 * Helper to fetch the current user
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Helper to fetch the full user profile on the server
 */
export async function getServerUser(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data: profile, error } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching server user profile:', error?.message);
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: profile.name || '',
      role: profile.role as any,
      avatar_url: profile.avatar_url || null,
      company_id: profile.company_id,
      created_at: profile.created_at,
    };
  } catch (err) {
    console.error('Unexpected error in getServerUser:', err);
    return null;
  }
}
