import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || '';

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || 'http://localhost:3000';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, x-insforge-service-key',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Resolve service key — mirror the admin-applications pattern:
  // proxy always forwards INSFORGE_SERVICE_KEY via x-insforge-service-key header
  const serviceKey =
    req.headers.get('x-insforge-service-key') ||
    Deno.env.get('INSFORGE_SERVICE_KEY') ||
    Deno.env.get('INSFORGE_ADMIN_KEY') ||
    anonKey;

  try {
    // Service-role client for DB ops (bypasses RLS)
    const insforge = createClient({
      baseUrl,
      anonKey: serviceKey,
      edgeFunctionToken: token,
      isServerMode: true,
    });

    // Verify the caller is authenticated
    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the caller is an admin
    const { data: profile } = await insforge.database
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    // Extract optional /:id segment from path
    const pathParts = url.pathname.replace(/\/+$/, '').split('/');
    const id = pathParts[pathParts.length - 1] !== '' &&
      pathParts[pathParts.length - 1] !== 'admin-announcements'
        ? pathParts[pathParts.length - 1]
        : null;

    // ── GET — List all announcements ────────────────────────────────────────
    if (req.method === 'GET') {
      const search   = url.searchParams.get('search') || '';
      const type     = url.searchParams.get('type') || '';
      const status   = url.searchParams.get('status') || ''; // 'active' | 'inactive' | ''
      const page     = parseInt(url.searchParams.get('page') || '0');
      const limit    = parseInt(url.searchParams.get('limit') || '20');

      let query = insforge.database
        .from('announcements')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
      }
      if (type && type !== 'all') {
        query = query.eq('type', type);
      }
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      return new Response(
        JSON.stringify({ announcements: data ?? [], total: count ?? 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── POST — Create new announcement + fan-out notifications ───────────────
    if (req.method === 'POST') {
      const body = await req.json();
      const {
        title,
        message,
        type = 'info',
        target_roles = ['candidate', 'recruiter'],
        is_active = false,
        show_as_banner = false,
        scheduled_at = null,
        expires_at = null,
      } = body;

      if (!title || !message) {
        return new Response(
          JSON.stringify({ error: 'title and message are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newAnn, error: insertErr } = await insforge.database
        .from('announcements')
        .insert([{
          title,
          message,
          type,
          target_roles,
          is_active,
          show_as_banner,
          scheduled_at,
          expires_at,
          image_url: body.image_url ?? null,
          view_count: 0,
          dismiss_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Fan-out in-app notifications when published immediately
      if (is_active && target_roles?.length > 0) {
        try {
          const { data: targetProfiles } = await insforge.database
            .from('profiles')
            .select('id')
            .in('role', target_roles);

          if (targetProfiles && targetProfiles.length > 0) {
            const notifications = targetProfiles.map((p: { id: string }) => ({
              user_id: p.id,
              title,
              message: message.replace(/\*\*/g, ''),
              type,
              is_read: false,
              metadata: { announcement_id: newAnn.id },
              created_at: new Date().toISOString(),
            }));
            await insforge.database.from('notifications').insert(notifications);
          }
        } catch (notifErr) {
          // Non-fatal: log but don't fail the response
          console.warn('[admin-announcements] Failed to fan-out notifications:', notifErr);
        }
      }

      return new Response(
        JSON.stringify({ announcement: newAnn }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── PATCH /:id — Update announcement ────────────────────────────────────
    if (req.method === 'PATCH') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing announcement id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();

      // Fetch existing record to detect activation transition
      const { data: existing } = await insforge.database
        .from('announcements')
        .select('is_active, title, message, type, target_roles')
        .eq('id', id)
        .single();

      const { data, error } = await insforge.database
        .from('announcements')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Fan-out notifications if this PATCH activates the announcement
      if (body.is_active === true && existing?.is_active === false) {
        try {
          const targetRoles = data.target_roles ?? existing?.target_roles ?? [];
          if (targetRoles.length > 0) {
            const { data: targetProfiles } = await insforge.database
              .from('profiles')
              .select('id')
              .in('role', targetRoles);

            if (targetProfiles && targetProfiles.length > 0) {
              const notifications = targetProfiles.map((p: { id: string }) => ({
                user_id: p.id,
                title: data.title ?? existing?.title,
                message: (data.message ?? existing?.message ?? '').replace(/\*\*/g, ''),
                type: data.type ?? existing?.type ?? 'info',
                is_read: false,
                metadata: { announcement_id: id },
                created_at: new Date().toISOString(),
              }));
              await insforge.database.from('notifications').insert(notifications);
            }
          }
        } catch (notifErr) {
          console.warn('[admin-announcements] Notification fan-out failed on activation:', notifErr);
        }
      }

      return new Response(
        JSON.stringify({ announcement: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── DELETE /:id — Delete announcement ────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing announcement id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Also clean up dismissals for this announcement
      await insforge.database
        .from('announcement_dismissals')
        .delete()
        .eq('announcement_id', id);

      const { error } = await insforge.database
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[admin-announcements] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
