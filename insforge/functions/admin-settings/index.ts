// @ts-nocheck — Deno edge function: npm: imports and Deno globals are valid at runtime
import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || 
                       Deno.env.get('INSFORGE_ADMIN_KEY') || 
                       req.headers.get('x-insforge-service-key') || 
                       Deno.env.get('INSFORGE_ANON_KEY') || 
                       Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY');

    const verifyClient = createClient({
      baseUrl,
      anonKey: anonKey || '',
      edgeFunctionToken: token,
      isServerMode: true
    });

    const { data: authData, error: authError } = await verifyClient.auth.getCurrentUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token' }), { status: 401 });
    }

    const userData = { id: authData.user.id };

    const insforge = createClient({ 
      baseUrl, 
      anonKey: serviceKey!,
      edgeFunctionToken: token,
      isServerMode: true 
    });

    const insforgeAdmin = createClient({
      baseUrl,
      anonKey: serviceKey!,
      isServerMode: true
    });

    const { data: profile } = await insforge.database
      .from('profiles')
      .select('role, is_active')
      .eq('id', userData.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    if (profile?.is_active !== true) {
      return new Response(JSON.stringify({ error: 'Forbidden, account is suspended' }), { status: 403 });
    }
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const section = url.searchParams.get('section');
      
      if (section === 'admins') {
        const { data: admins, error } = await insforgeAdmin.database
          .from('profiles')
          .select('id, name, email, role, avatar_url, created_at')
          .or('role.eq.admin,role.eq.super_admin')
          .order('created_at', { ascending: false });

        if (error && (error.message || error.code)) throw error;
        return new Response(JSON.stringify({ admins }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Fetch platform settings from the platform_settings table
      const { data: settings, error } = await insforgeAdmin.database
        .from('platform_settings')
        .select('*');

      if (error && (error.message || error.code)) throw error;

      const formatted = (settings ?? []).reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      return new Response(JSON.stringify(formatted), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
       const { email, action } = await req.json();

       if (action === 'add_admin') {
         // Query multiple profiles matching the email to handle duplicate accounts gracefully
         const { data: users, error: findError } = await insforgeAdmin.database
           .from('profiles')
           .select('id, role')
           .eq('email', email);

         if (findError) return new Response(JSON.stringify({ error: findError.message || 'Database error' }), { status: 500 });
         if (!users || users.length === 0) {
           return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
         }

         const targetUser = users[0];
         if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
           return new Response(JSON.stringify({ error: 'User is already an admin' }), { status: 400 });
         }

         const { error: updateError } = await insforgeAdmin.database
           .from('profiles')
           .update({ role: 'admin' })
           .eq('id', targetUser.id);

         if (updateError && (updateError.message || updateError.code)) throw updateError;

         const { error: insertAdminError } = await insforgeAdmin.database
           .from('admin_users')
           .upsert({ user_id: targetUser.id });

         if (insertAdminError && (insertAdminError.message || insertAdminError.code)) throw insertAdminError;

         // Log audit entry
         try {
           const ipAddress = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '';
           await insforgeAdmin.database.from('audit_logs').insert([{
             actor_id: userData.id,
             action: 'add_admin',
             table_name: 'profiles',
             record_id: targetUser.id,
             old_data: { role: targetUser.role },
             new_data: { role: 'admin' },
             ip_address: ipAddress,
             created_at: new Date().toISOString()
           }]);
         } catch (auditErr) {
           console.error('Audit failed:', auditErr);
         }

         return new Response(JSON.stringify({ message: 'User granted admin access' }), { status: 200 });
       }
    }

    if (req.method === 'PATCH') {
       const { key, value } = await req.json();
       
       if (!key || value === undefined) {
         return new Response(JSON.stringify({ error: 'Missing key or value' }), { status: 400 });
       }

       // Fetch old value first for audit logs
       let oldValue = null;
       try {
         const { data: oldData } = await insforgeAdmin.database
           .from('platform_settings')
           .select('value')
           .eq('key', key)
           .maybeSingle();
         if (oldData) oldValue = oldData.value;
       } catch (e) {
         console.warn('Failed to fetch old setting value for audit:', e);
       }

       const escapedValue = JSON.stringify(value).replace(/'/g, "''");
       const escapedKey = String(key).replace(/'/g, "''");
       const sql = `UPDATE public.platform_settings SET value = '${escapedValue}'::jsonb, updated_at = now() WHERE key = '${escapedKey}'`;

       const { data: resData, error } = await insforgeAdmin.database.rpc('exec_sql', { query: sql });

       if (error && (error.message || error.code)) throw error;
       if (resData && resData.success === false) {
         throw new Error(resData.error || 'Database operation failed');
       }

       // Log to public.audit_logs
       try {
         const ipAddress = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '';
         const isFeature = key === 'feature_flags';
         const actionName = isFeature ? 'toggle_feature' : 'update_settings';
         
         await insforgeAdmin.database
           .from('audit_logs')
           .insert([{
             actor_id: userData.id,
             action: actionName,
             table_name: 'platform_settings',
             record_id: key,
             old_data: oldValue,
             new_data: value,
             ip_address: ipAddress,
             created_at: new Date().toISOString()
           }]);
       } catch (auditErr) {
         console.error('Failed to log admin settings audit entry:', auditErr);
       }

       return new Response(JSON.stringify({ message: 'Settings updated' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
       const { id } = await req.json();
       const { error } = await insforgeAdmin.database
         .from('profiles')
         .update({ role: 'candidate' })
         .eq('id', id);

       if (error && (error.message || error.code)) throw error;

       const { error: deleteAdminError } = await insforgeAdmin.database
         .from('admin_users')
         .delete()
         .eq('user_id', id);

       if (deleteAdminError && (deleteAdminError.message || deleteAdminError.code)) throw deleteAdminError;

       // Log audit entry
       try {
         const ipAddress = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '';
         await insforgeAdmin.database.from('audit_logs').insert([{
           actor_id: userData.id,
           action: 'remove_admin',
           table_name: 'profiles',
           record_id: id,
           old_data: { role: 'admin' },
           new_data: { role: 'candidate' },
           ip_address: ipAddress,
           created_at: new Date().toISOString()
         }]);
       } catch (auditErr) {
         console.error('Audit failed:', auditErr);
       }

       return new Response(JSON.stringify({ message: 'Admin access removed' }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err: any) {
    console.error('Admin Settings Edge Function Error:', err);
    return new Response(JSON.stringify({ 
      error: err.message || 'Internal Server Error',
      details: err.details || null,
      code: err.code || null,
      stack: err.stack || null,
      raw: String(err)
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
