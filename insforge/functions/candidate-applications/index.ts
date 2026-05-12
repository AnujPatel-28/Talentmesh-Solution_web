import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const createApplicationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  coverLetter: z.string().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  resumeUrl: z.string().url('Invalid resume URL'),
  appliedViaReferralId: z.string().uuid().nullable().optional(),
});

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') return new Response('ok', { status: 204, headers: corsHeaders });

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token || '', isServerMode: true });
  
  // Try to get user if token exists, but allow public applications too if needed?
  // User request says "CANDIDATES can apply", usually implies logged in, but let's check profile.
  let candidateId = null;
  if (token) {
    const { data: authData } = await insforge.auth.getCurrentUser();
    if (authData?.user && authData.user.id !== 'project-admin-with-api-key') {
      candidateId = authData.user.id;
    }
  }

  const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

  if (req.method === 'POST') {
    try {
      const payload = await req.json();
      const validation = createApplicationSchema.safeParse(payload);

      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'Invalid application payload', errors: validation.error.flatten().fieldErrors }), { status: 400, headers: corsHeaders });
      }

      const input = validation.data;

      // 1. Check Job
      const { data: job, error: jobError } = await insforgeAdmin.database
        .from('jobs')
        .select('id, title, status, is_approved, applications_count')
        .eq('id', input.jobId)
        .single();

      if (jobError || !job) {
        return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404, headers: corsHeaders });
      }

      // 2. Insert Application
      const now = new Date().toISOString();
      const { data: application, error: applyError } = await insforgeAdmin.database
        .from('applications')
        .insert([{
          job_id: input.jobId,
          candidate_id: candidateId, // Can be null for public apps
          full_name: input.fullName,
          email: input.email,
          phone: input.phone,
          cover_letter: input.coverLetter || null,
          portfolio_url: input.portfolioUrl || null,
          resume_url: input.resumeUrl,
          applied_via_referral_id: input.appliedViaReferralId || null,
          status: 'applied',
          applied_at: now,
          updated_at: now,
        }])
        .select()
        .single();

      if (applyError) throw applyError;

      // 3. Update Job Stats
      await insforgeAdmin.database
        .from('jobs')
        .update({ applications_count: (job.applications_count || 0) + 1 })
        .eq('id', input.jobId);

      // 4. Update Referral Stats (if applicable)
      if (input.appliedViaReferralId) {
        const { data: referral } = await insforgeAdmin.database
          .from('referrals')
          .select('applications')
          .eq('id', input.appliedViaReferralId)
          .single();
        
        if (referral) {
          await insforgeAdmin.database
            .from('referrals')
            .update({ applications: (referral.applications || 0) + 1 })
            .eq('id', input.appliedViaReferralId);
        }
      }

      return new Response(JSON.stringify({ application }), { status: 201, headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
