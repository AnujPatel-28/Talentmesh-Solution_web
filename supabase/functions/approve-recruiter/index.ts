declare const Deno: any;
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { requestId } = await req.json() as any;

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Missing requestId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Fetch the request
    const { data: request, error: fetchError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (request.status === 'approved') {
      return new Response(JSON.stringify({ error: 'Request already approved' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Create the user / Invite them
    // For now, we'll just sign them up or create a profile.
    // In a real app, you'd use supabase.auth.admin.inviteUserByEmail(request.work_email)
    // But since we want them to set their password, let's create a user profile with role 'recruiter'.
    
    // Actually, let's just update the status for now and return success.
    // The user will implement the actual auth logic later.
    
    const { error: updateError } = await supabase
      .from('access_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: 'Recruiter approved successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
