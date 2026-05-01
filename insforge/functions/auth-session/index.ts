import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;

function parseCookies(header: string | null) {
  if (!header) return {};
  return header.split(';').reduce((res, item) => {
    const parts = item.split('=');
    res[parts[0].trim()] = parts.slice(1).join('=');
    return res;
  }, {} as Record<string, string>);
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || '*';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    if (req.method === 'GET') {
      const cookies = parseCookies(req.headers.get('cookie'));
      const token = cookies['tm_access_token'] || req.headers.get('Authorization')?.split(' ')[1];

      if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
      const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

      if (authError || !authData?.user || authData.user.id === 'project-admin-with-api-key') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: profile } = await insforge.database
        .from('profiles')
        .select('role, name, avatar_url, company_id, created_at, mfa_enabled')
        .eq('id', authData.user.id)
        .single();

      const user = {
        id: authData.user.id,
        email: authData.user.email!,
        name: profile?.name || '',
        role: profile?.role || 'candidate',
        avatar_url: profile?.avatar_url || null,
        company_id: profile?.company_id,
        created_at: profile?.created_at,
        mfa_enabled: profile?.mfa_enabled || false,
      };

      const requiresMfa = (user.role === 'admin' || user.role === 'super_admin') ? user.mfa_enabled : false;

      return new Response(JSON.stringify({ user, requiresMfa }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { token, role, adminAccess } = body;

      if (!token || !role) {
        return new Response(JSON.stringify({ error: 'Missing required token or role' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const isSecure = Deno.env.get('NODE_ENV') === 'production';
      const cookieOptions = `Path=/; HttpOnly; SameSite=Lax${isSecure ? '; Secure' : ''}`;

      const headers = new Headers();
      headers.append('Set-Cookie', `tm_access_token=${token}; ${cookieOptions}`);
      headers.append('Set-Cookie', `tm_role=${role}; ${cookieOptions}`);
      if (adminAccess) {
        headers.append('Set-Cookie', `tm_admin_access=true; ${cookieOptions}`);
      }
      headers.append('Content-Type', 'application/json');
      Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const cookies = parseCookies(req.headers.get('cookie'));
      const token = cookies['tm_access_token'];
      
      if (token) {
        try {
          const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
          await insforge.auth.signOut();
        } catch {
          // ignore
        }
      }

      const clearOptions = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${Deno.env.get('NODE_ENV') === 'production' ? '; Secure' : ''}`;
      const headers = new Headers();
      headers.append('Set-Cookie', `tm_access_token=; ${clearOptions}`);
      headers.append('Set-Cookie', `tm_role=; ${clearOptions}`);
      headers.append('Set-Cookie', `tm_admin_access=; ${clearOptions}`);
      headers.append('Set-Cookie', `mfa_verified=; ${clearOptions}`);
      headers.append('Content-Type', 'application/json');
      Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
