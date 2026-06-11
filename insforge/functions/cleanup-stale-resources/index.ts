import { createClient } from 'npm:@insforge/sdk';

export default async function handler(req: Request): Promise<Response> {
  const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL') || req.headers.get('x-insforge-url')!;
  const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('INSFORGE_ADMIN_KEY') || Deno.env.get('API_KEY') || '';

  const origin = req.headers.get('Origin') || '*';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, x-insforge-url, x-insforge-service-key',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  // Auth check - only service key or admin role allowed to trigger cleanup
  const requestServiceKey = req.headers.get('x-insforge-service-key') || req.headers.get('Authorization')?.split(' ')[1];
  if (requestServiceKey !== serviceKey && serviceKey !== '') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const adminDb = createClient({ baseUrl, anonKey: serviceKey, isServerMode: true });
  const workerId = `edge-worker-${Math.random().toString(36).substring(2, 15)}`;

  // Acquire lock
  const { data: lockAcquired } = await adminDb.database.rpc('claim_cleanup_lock', {
    job_name_val: 'cleanup_storage_physical',
    worker_val: workerId
  });

  if (!lockAcquired) {
    return new Response(JSON.stringify({ error: 'Failed to acquire lock' }), { status: 423, headers: corsHeaders });
  }

  let restoredCount = 0;
  let deletedCount = 0;

  try {
    // 1. Fetch items in restoring or deleted status
    const { data: items } = await adminDb.database
      .from('storage_quarantine')
      .select('*')
      .in('status', ['restoring', 'deleted']);

    if (items && items.length > 0) {
      for (const item of items) {
        if (item.bucket_name === 'resumes') {
          let shouldRemove = false;

          if (item.status === 'restoring') {
            const { data: blob } = await adminDb.storage.from('resumes').download(item.file_path);
            if (blob) {
              await adminDb.storage.from('resumes').upload(item.original_path, blob);
              shouldRemove = true;

              await adminDb.database
                .from('storage_quarantine')
                .update({ status: 'restored', restored_at: new Date().toISOString() })
                .eq('id', item.id);
              
              restoredCount++;
            }
          } else if (item.status === 'deleted') {
            shouldRemove = true;

            await adminDb.database
              .from('storage_quarantine')
              .delete()
              .eq('id', item.id);

            deletedCount++;
          }

          if (shouldRemove) {
            await adminDb.storage.from('resumes').remove(item.file_path);
          }
        }
      }
    }

    // Log telemetry
    await adminDb.database.rpc('log_cleanup_telemetry', {
      job_name_val: 'cleanup_storage_physical',
      deleted_count_val: deletedCount,
      duration_ms_val: 0
    });

  } catch (err: any) {
    return new Response(err.message, { status: 500, headers: corsHeaders });
  } finally {
    // Release lock
    await adminDb.database.rpc('release_cleanup_lock', {
      job_name_val: 'cleanup_storage_physical',
      worker_val: workerId
    });
  }

  return new Response(JSON.stringify({ success: true, restoredCount, deletedCount }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
