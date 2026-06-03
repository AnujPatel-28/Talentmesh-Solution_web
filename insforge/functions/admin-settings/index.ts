import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    let userData;
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      userData = { id: payload.sub, email: payload.email, role: payload.role };
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token format' }), { status: 401 });
    }

    if (!userData || !userData.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('INSFORGE_ADMIN_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY');
    const insforge = createClient({ 
      baseUrl, 
      anonKey: serviceKey!,
      edgeFunctionToken: token,
      isServerMode: true 
    });

    const { data: profile } = await insforge.database
      .from('profiles')
      .select('role')
      .eq('id', userData.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const section = url.searchParams.get('section');
      
      if (section === 'admins') {
        const { data: admins, error } = await insforge.database
          .from('profiles')
          .select('id, full_name, email, role, avatar_url, created_at')
          .or('role.eq.admin,role.eq.super_admin')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ admins }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Fetch platform settings from a hypothetical 'platform_settings' table or similar
      const { data: settings, error } = await insforge.database
        .from('platform_settings')
        .select('*');

      if (error) throw error;

      const formatted = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      return new Response(JSON.stringify(formatted), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
       const { email, action } = await req.json();

       if (action === 'add_admin') {
         const { data: targetUser, error: findError } = await insforge.database
           .from('profiles')
           .select('id, role')
           .eq('email', email)
           .single();

         if (findError) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
         if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
           return new Response(JSON.stringify({ error: 'User is already an admin' }), { status: 400 });
         }

         const { error: updateError } = await insforge.database
           .from('profiles')
           .update({ role: 'admin' })
           .eq('id', targetUser.id);

         if (updateError) throw updateError;
         return new Response(JSON.stringify({ message: 'User granted admin access' }), { status: 200 });
       }
    }

    if (req.method === 'PATCH') {
       const { key, value } = await req.json();
       
       const { error } = await insforge.database
         .from('platform_settings')
         .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

       if (error) throw error;
       return new Response(JSON.stringify({ message: 'Settings updated' }), { status: 200 });
    }

    if (req.method === 'DELETE') {
       const { id } = await req.json();
       const { error } = await insforge.database
         .from('profiles')
         .update({ role: 'candidate' })
         .eq('id', id);

       if (error) throw error;
       return new Response(JSON.stringify({ message: 'Admin access removed' }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err: any) {
    console.error('Admin Settings Edge Function Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
}
