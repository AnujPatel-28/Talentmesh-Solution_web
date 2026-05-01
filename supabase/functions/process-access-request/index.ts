declare const Deno: any;
import { createClient } from '@supabase/supabase-js'

/**
 * CORS headers for cross-origin requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Production-level Edge Function for processing access requests.
 * Handles validation, database persistence, and auditing.
 */
Deno.serve(async (req: Request) => {
  // 1. Handle Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Incoming ${req.method} request...`);

  try {
    // 2. Environment Verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] CRITICAL: Missing environment variables.`);
      return new Response(
        JSON.stringify({ error: 'Internal Server Configuration Error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Payload Parsing
    const body = await req.json() as any;
    
    // 4. Input Validation (Production Guard)
    const requiredFields = ['full_name', 'company_name', 'work_email', 'industry'];
    const missingFields = requiredFields.filter(f => !body[f]);
    
    if (missingFields.length > 0) {
      console.warn(`[${requestId}] Validation failed: Missing ${missingFields.join(', ')}`);
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Database Initialization
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 6. Persistence Logic
    console.log(`[${requestId}] Processing ${body.request_type} for ${body.company_name} (${body.work_email})`);
    
    const { error: dbError } = await supabase
      .from('access_requests')
      .insert({
        full_name: body.full_name,
        company_name: body.company_name,
        company_website: body.company_website,
        industry: body.industry,
        company_size: body.company_size,
        work_email: body.work_email,
        phone_number: body.phone_number,
        role_in_company: body.role_in_company,
        num_roles: body.num_roles,
        hiring_categories: body.hiring_categories || [],
        hiring_timeline: body.hiring_timeline,
        additional_notes: body.additional_notes,
        request_type: body.request_type || 'access_application',
        metadata: {
          request_id: requestId,
          source: 'recruiter_onboarding_v1'
        }
      });

    if (dbError) {
      console.error(`[${requestId}] Database Error:`, dbError);
      throw dbError;
    }

    // 7. Final Response
    console.log(`[${requestId}] Success: Request stored.`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Request processed successfully',
        requestId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error(`[${requestId}] Unexpected Error:`, error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred processing your request.' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
