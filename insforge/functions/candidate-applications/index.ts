import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const createApplicationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  coverLetter: z.string().optional(),
  applyType: z.enum(['quick', 'manual']).default('quick'),
  resumeUrl: z.string().optional(),
  resumeId: z.string().uuid().optional().nullable(),
  screeningAnswers: z.record(z.string(), z.any()).optional(),
});

function getStorageKeyFromUrl(urlOrKey: string | null | undefined): string {
  if (!urlOrKey) return '';
  if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    try {
      const parsed = new URL(urlOrKey);
      const parts = parsed.pathname.split('/objects/');
      if (parts.length > 1) {
        return decodeURIComponent(parts[1]);
      }
    } catch {
      // fallback
    }
  }
  return urlOrKey;
}

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY');

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
  const reqBaseUrl = req.headers.get('x-insforge-url') || baseUrl;
  const reqAnonKey = req.headers.get('x-insforge-anon-key') || anonKey;
  const reqServiceKey = req.headers.get('x-insforge-service-key') || serviceKey || reqAnonKey;

  const insforge = createClient({ baseUrl: reqBaseUrl, anonKey: reqAnonKey, edgeFunctionToken: token || '', isServerMode: true });
  
  // Authenticate the user
  let candidateId: string | null = null;
  if (token) {
    const { data: authData } = await insforge.auth.getCurrentUser();
    if (authData?.user && authData.user.id !== 'project-admin-with-api-key') {
      candidateId = authData.user.id;
    }
  }

  // Admin client for all DB queries to bypass RLS (avoids project-admin-with-api-key UUID error)
  const insforgeAdmin = createClient({ 
    baseUrl: reqBaseUrl, 
    anonKey: reqServiceKey,
    isServerMode: true
  });

  // --- GET Handler: Fetch candidate's applications ---
  if (req.method === 'GET') {
    try {
      if (!candidateId) {
        return new Response(JSON.stringify({ error: 'You must be logged in to view applications.' }), { status: 401, headers: corsHeaders });
      }

      const url = new URL(req.url);
      const jobId = url.searchParams.get('jobId');

      // If jobId is provided, check if the candidate has already applied to this specific job
      if (jobId) {
        const { data: existing, error: existingError } = await insforgeAdmin.database
          .from('applications')
          .select('id, status')
          .eq('candidate_id', candidateId)
          .eq('job_id', jobId)
          .single();

        if (existingError || !existing) {
          return new Response(JSON.stringify({ status: null }), { status: 200, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ status: existing.status, id: existing.id }), { status: 200, headers: corsHeaders });
      }

      // Otherwise, fetch all applications for this candidate with job/company details
      const { data: applications, error: appsError } = await insforge.database
        .from('applications')
        .select('*, jobs(id, title, location, type, salary_min, salary_max, currency, companies(name, logo_url))')
        .eq('candidate_id', candidateId)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      return new Response(JSON.stringify({ applications: applications || [] }), { status: 200, headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

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

      // 2. Upload Resume Snapshot to Private Bucket
      const applicationId = crypto.randomUUID();
      let snapshotKey: string | null = null;
      let snapshotUrl: string | null = null;

      if (input.resumeUrl) {
        try {
          const originalKey = getStorageKeyFromUrl(input.resumeUrl);
          if (originalKey) {
            // Download the resume blob from public resumes bucket
            const { data: fileBlob, error: downloadError } = await insforgeAdmin.storage
              .from('resumes')
              .download(originalKey);

            if (downloadError || !fileBlob) {
              throw new Error(`Failed to download original resume: ${downloadError?.message || 'Empty file'}`);
            }

            // Upload to private application-snapshots bucket
            snapshotKey = `applications/${applicationId}/resume.pdf`;
            const { data: uploadData, error: uploadError } = await insforgeAdmin.storage
              .from('application-snapshots')
              .upload(snapshotKey, fileBlob);

            if (uploadError || !uploadData) {
              throw new Error(`Failed to upload resume snapshot: ${uploadError?.message}`);
            }
            snapshotUrl = uploadData.url;
          }
        } catch (err: any) {
          console.error('[candidate-applications] Resume snapshot failed:', err.message);
          return new Response(JSON.stringify({ error: `Resume snapshot error: ${err.message}` }), { status: 500, headers: corsHeaders });
        }
      }

      // 3. Insert Application
      const now = new Date().toISOString();
      let application: any = null;
      try {
        const { data, error: applyError } = await insforgeAdmin.database
          .from('applications')
          .insert([{
            id: applicationId,
            job_id: input.jobId,
            candidate_id: candidateId, // Can be null for public apps
            cover_letter: input.coverLetter || null,
            status: 'applied',
            applied_at: now,
            updated_at: now,
            apply_type: input.applyType,
            resume_url: snapshotUrl || input.resumeUrl || null, // Keep legacy resume_url populated (Phase A)
            resume_id: input.resumeId || null,
            resume_snapshot_key: snapshotKey || null,
            screening_answers: input.screeningAnswers || null,
          }])
          .select()
          .single();

        if (applyError || !data) {
          throw applyError || new Error('Failed to insert application');
        }
        application = data;
      } catch (dbError: any) {
        console.error('[candidate-applications] Database insert failed, rolling back storage snapshot:', dbError.message);
        if (snapshotKey) {
          // Rollback: delete snapshot from storage to prevent leak
          await insforgeAdmin.storage
            .from('application-snapshots')
            .remove(snapshotKey);
        }
        
        let friendlyMessage = dbError.message || 'Unknown database error';
        if (dbError.code === '23505' || friendlyMessage.includes('idx_unique_candidate_job_application')) {
          friendlyMessage = 'You have already applied for this job.';
        }
        
        return new Response(JSON.stringify({ error: friendlyMessage }), { status: 400, headers: corsHeaders });
      }

      // 3. Update Job Stats
      await insforgeAdmin.database
        .from('jobs')
        .update({ applications_count: (job.applications_count || 0) + 1 })
        .eq('id', input.jobId);

      return new Response(JSON.stringify({ application }), { status: 201, headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
