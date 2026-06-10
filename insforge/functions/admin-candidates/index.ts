import { createClient } from 'npm:@insforge/sdk';

async function checkIdempotency(db: any, key: string | null): Promise<Response | null> {
  if (!key) return null;
  const { data, error } = await db.database
    .from('idempotency_keys')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return new Response(JSON.stringify({
    success: true,
    idempotent: true,
    response_hash: data.response_hash,
    response_ref: data.response_ref
  }), {
    status: data.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, x-idempotency-key',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json'
    }
  });
}

async function saveIdempotency(db: any, key: string | null, status: number, payload: any) {
  if (!key) return;
  const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  
  let responseRef = null;
  if (payload && typeof payload === 'object') {
    const possibleId = payload.id || payload.candidate?.id || payload.recruiter?.id || payload.job?.id || payload.userId;
    if (possibleId && typeof possibleId === 'string' && isUuid(possibleId)) {
      responseRef = possibleId;
    }
  }

  const responseBodyText = JSON.stringify(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(responseBodyText));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const responseHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  await db.database.from('idempotency_keys').insert([{
    key,
    status,
    response_hash: responseHash,
    response_ref: responseRef
  }]);
}

export default async function handler(request: Request): Promise<Response> {
  const INSFORGE_URL = request.headers.get('x-insforge-url') || Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const INSFORGE_ANON_KEY = request.headers.get('x-insforge-anon-key') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || '';
  const SERVICE_KEY = request.headers.get('x-insforge-service-key') || Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('API_KEY') || INSFORGE_ANON_KEY;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, x-idempotency-key',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: corsHeaders });

  const rawToken = authHeader.replace(/^Bearer\s+/i, '');

  try {
    const db = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: SERVICE_KEY,
      isServerMode: true
    });

    let payload;
    try {
      const payloadBase64 = rawToken.split('.')[1];
      payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token format' }), { status: 401, headers: corsHeaders });
    }

    const userData = { id: payload.sub };

    const { data: profile, error: profileError } = await db.database
      .from('profiles')
      .select('role')
      .eq('id', userData.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Unauthorized, profile not found' }), { status: 401, headers: corsHeaders });
    }

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const idempotencyKey = request.headers.get('x-idempotency-key');
    if (idempotencyKey) {
      const cachedResponse = await checkIdempotency(db, idempotencyKey);
      if (cachedResponse) return cachedResponse;
    }

    const url = new URL(request.url);

    if (request.method === 'GET') {
      const search = url.searchParams.get('search');
      const discoverable = url.searchParams.get('discoverable');
      const page = parseInt(url.searchParams.get('page') || '0');
      const requestedLimit = parseInt(url.searchParams.get('limit') || '25');
      const limit = Math.min(requestedLimit, 100);
      const sort = url.searchParams.get('sort') || 'newest';

      let selectClause = '*, candidate_profiles(*)';
      if (discoverable === 'true' || discoverable === 'false' || discoverable === 'missing_primary') {
        selectClause = '*, candidate_profiles!inner(*)';
      }

      let query = db.database.from('profiles')
        .select(selectClause, { count: 'exact' })
        .eq('role', 'candidate');

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      let orderField = 'created_at';
      let ascending = false;
      if (sort === 'oldest') {
        orderField = 'created_at';
        ascending = true;
      } else if (sort === 'name_asc') {
        orderField = 'name';
        ascending = true;
      } else if (sort === 'name_desc') {
        orderField = 'name';
        ascending = false;
      }

      if (discoverable === 'true') {
        query = query.eq('candidate_profiles.is_discoverable', true);
      } else if (discoverable === 'false') {
        query = query.eq('candidate_profiles.is_discoverable', false);
      } else if (discoverable === 'missing_primary') {
        query = query.filter('candidate_profiles.primary_resume_id', 'is', null);
      }

      const { data, count, error } = await query
        .order(orderField, { ascending })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;
      
      const totalCount = count || 0;
      const resPayload = { 
        items: data || [], 
        candidates: data || [], 
        total: totalCount,
        page,
        hasMore: (page + 1) * limit < totalCount,
        nextCursor: null
      };

      return new Response(JSON.stringify(resPayload), { status: 200, headers: corsHeaders });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { action } = body;

      if (action === 'bulk-status') {
        const { ids, status } = body;
        if (!ids || !Array.isArray(ids) || !status) {
          return new Response(JSON.stringify({ error: 'ids and status are required' }), { status: 400, headers: corsHeaders });
        }
        const { error } = await db.database
          .from('profiles')
          .update({ status })
          .in('id', ids);
        if (error) throw error;

        const resPayload = { success: true, count: ids.length };
        if (idempotencyKey) {
          await saveIdempotency(db, idempotencyKey, 200, resPayload);
        }
        return new Response(JSON.stringify(resPayload), { status: 200, headers: corsHeaders });
      }

      if (action === 'bulk-active') {
        const { ids, is_active } = body;
        if (!ids || !Array.isArray(ids) || is_active === undefined) {
          return new Response(JSON.stringify({ error: 'ids and is_active are required' }), { status: 400, headers: corsHeaders });
        }
        const { error } = await db.database
          .from('profiles')
          .update({ is_active })
          .in('id', ids);
        if (error) throw error;

        const resPayload = { success: true, count: ids.length };
        if (idempotencyKey) {
          await saveIdempotency(db, idempotencyKey, 200, resPayload);
        }
        return new Response(JSON.stringify(resPayload), { status: 200, headers: corsHeaders });
      }

      if (action === 'bulk-delete') {
        const { ids } = body;
        if (!ids || !Array.isArray(ids)) {
          return new Response(JSON.stringify({ error: 'ids are required' }), { status: 400, headers: corsHeaders });
        }

        // 1. Delete from candidate_profiles
        const { error: cpErr } = await db.database
          .from('candidate_profiles')
          .delete()
          .in('user_id', ids);
        if (cpErr) throw cpErr;

        // 2. Delete from profiles
        const { error: pErr } = await db.database
          .from('profiles')
          .delete()
          .in('id', ids);
        if (pErr) throw pErr;

        // 3. Delete from auth using Admin API
        const adminUrl = `${INSFORGE_URL}/api/auth/users`;
        const deleteResp = await fetch(adminUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY!,
            'Authorization': `Bearer ${SERVICE_KEY}`
          },
          body: JSON.stringify({ userIds: ids })
        });

        if (!deleteResp.ok) {
          const errData = await deleteResp.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || 'Failed to delete users via Admin API');
        }

        const resPayload = { success: true, count: ids.length };
        if (idempotencyKey) {
          await saveIdempotency(db, idempotencyKey, 200, resPayload);
        }
        return new Response(JSON.stringify(resPayload), { status: 200, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: 'Invalid POST action' }), { status: 400, headers: corsHeaders });
    }

    if (request.method === 'PATCH') {
      const id = url.pathname.split('/').pop();
      if (!id || id === 'admin-candidates') {
        return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400, headers: corsHeaders });
      }
      const body = await request.json();

      const { data, error } = await db.database
        .from('profiles')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const resPayload = { candidate: data };
      if (idempotencyKey) {
        await saveIdempotency(db, idempotencyKey, 200, resPayload);
      }
      return new Response(JSON.stringify(resPayload), { status: 200, headers: corsHeaders });
    }

    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400, headers: corsHeaders });

      // 1. Delete from candidate_profiles
      const { error: cpError } = await db.database
        .from('candidate_profiles')
        .delete()
        .eq('user_id', id);
      if (cpError) throw cpError;

      // 2. Delete from profiles
      const { error: pError } = await db.database
        .from('profiles')
        .delete()
        .eq('id', id);
      if (pError) throw pError;

      // 3. Delete the auth user using correct InsForge Admin API via fetch
      const adminUrl = `${INSFORGE_URL}/api/auth/users`;
      const deleteResp = await fetch(adminUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY!,
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ userIds: [id] })
      });

      if (!deleteResp.ok) {
        const errData = await deleteResp.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to delete user via Admin API');
      }

      const resPayload = { success: true };
      if (idempotencyKey) {
        await saveIdempotency(db, idempotencyKey, 200, resPayload);
      }
      return new Response(JSON.stringify(resPayload), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}
