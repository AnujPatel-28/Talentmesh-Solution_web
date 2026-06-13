import { createClient } from 'npm:@insforge/sdk';

export default async function handler(req: Request): Promise<Response> {
  const INSFORGE_URL = req.headers.get('x-insforge-url') || Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const origin = req.headers.get('Origin') || 'http://localhost:3000';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  try {
    const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('INSFORGE_ADMIN_KEY') || Deno.env.get('API_KEY') || '';
    const incomingKey = req.headers.get('x-insforge-service-key') || req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

    if (!incomingKey || incomingKey !== serviceKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid service key' }), { status: 401, headers: corsHeaders });
    }

    const db = createClient({
      baseUrl: INSFORGE_URL,
      anonKey: serviceKey,
      isServerMode: true
    });

    // Clean up expired idempotency keys
    const { data, error } = await db.database
      .from('idempotency_keys')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Expired idempotency keys cleaned successfully.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('cleanup-idempotency-keys error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
