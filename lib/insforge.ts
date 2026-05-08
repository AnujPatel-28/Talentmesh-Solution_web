import { createClient } from '@insforge/sdk';
import { User } from '@/types/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('CRITICAL ERROR: Missing environment variable NEXT_PUBLIC_INSFORGE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('CRITICAL ERROR: Missing environment variable NEXT_PUBLIC_INSFORGE_ANON_KEY');
}

// Client containing the anon key, safe for both client and server pages
//changing this line 
export const insforge = createClient({
  baseUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/v1/remote` : supabaseUrl,
  anonKey: supabaseAnonKey,
});

/**
 * Helper to invoke Edge Functions manually to bypass SDK URL construction bug.
 */
export async function invokeFunction(slug: string, options: { 
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  queries?: Record<string, string | undefined>;
  path?: string;
} = {}) {
  const { method = 'POST', body, headers = {}, queries = {}, path = '' } = options;
  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? `${window.location.origin}/api/v1/remote` : (process.env.NEXT_PUBLIC_INSFORGE_URL || '');
  
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
    ...headers
  };

  if (authHeader) {
    finalHeaders['Authorization'] = authHeader;
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

  // 15-second timeout — fail fast rather than hanging until the browser gives up (~60-120s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  fetchOptions.signal = controller.signal;

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return { data: null, error: { message: 'Request timed out — please try again.', status: 408 } };
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Not JSON, likely HTML error page
    }
    return { data: null, error: { message: errorMessage, status: response.status } };
  }

  try {
    const text = await response.text();
    if (!text) return { data: null, error: null };
    const data = JSON.parse(text);
    return { data, error: null };
  } catch (err) {
    console.error('Failed to parse response as JSON:', err);
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
 * Refresh the access token using the InsForge httpOnly refresh cookie
 * (set by the Next.js proxy when the login response forwarded InsForge's Set-Cookie).
 * Returns the new accessToken, or null if refresh failed.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    // Use the custom Next.js proxy at /api/auth/refresh.
    // The insforge_refresh_token cookie has Path=/api/auth, so the browser sends it
    // to requests under /api/auth — this route matches. The old /api/v1/remote path
    // did NOT match and the cookie was never forwarded, causing every refresh to 401.
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth/refresh`
      : `${process.env.NEXT_PUBLIC_INSFORGE_URL}/api/auth/refresh`;
    const csrfToken = typeof window !== 'undefined'
      ? window.sessionStorage.getItem('tm_csrf_token') || ''
      : '';
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
      if (data?.csrfToken) window.sessionStorage.setItem('tm_csrf_token', data.csrfToken);
      window.sessionStorage.setItem('tm_token', newToken);
      const isSecure = window.location.protocol === 'https:';
      const sameSite = isSecure ? 'SameSite=None; Secure;' : 'SameSite=Lax;';
      document.cookie = `tm_access_token=${newToken}; path=/; ${sameSite} max-age=${60 * 60 * 24 * 7}`;
    }
    return newToken;
  } catch {
    return null;
  }
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
    const csrfToken = typeof window !== 'undefined'
      ? window.sessionStorage.getItem('tm_csrf_token') || ''
      : '';
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
    // Rotate csrfToken
    if (data?.csrfToken && typeof window !== 'undefined') {
      window.sessionStorage.setItem('tm_csrf_token', data.csrfToken);
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
