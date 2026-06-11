import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, x-insforge-service-key',
  'Access-Control-Allow-Credentials': 'true',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const applicationId = url.searchParams.get('applicationId');
  const accessType = url.searchParams.get('accessType') === 'downloaded' ? 'downloaded' : 'viewed';

  if (!applicationId) {
    return new Response(JSON.stringify({ error: 'Missing applicationId parameter' }), { status: 400, headers: corsHeaders });
  }

  const reqBaseUrl = req.headers.get('x-insforge-url') || baseUrl;
  const reqAnonKey = req.headers.get('x-insforge-anon-key') || anonKey;
  const reqServiceKey = req.headers.get('x-insforge-service-key') || serviceKey || reqAnonKey;

  const insforge = createClient({ baseUrl: reqBaseUrl, anonKey: reqAnonKey, edgeFunctionToken: token, isServerMode: true });
  const insforgeAdmin = createClient({ baseUrl: reqBaseUrl, anonKey: reqServiceKey, isServerMode: true });

  try {
    // 1. Authenticate caller
    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // 2. Fetch application and job details
    const { data: appData, error: appError } = await insforgeAdmin.database
      .from('applications')
      .select('id, candidate_id, resume_snapshot_key, jobs(recruiter_id)')
      .eq('id', applicationId)
      .single();

    if (appError || !appData) {
      return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: corsHeaders });
    }

    // 3. Authorization Check: Admin, candidate (owner), or recruiter (owner)
    const { data: profile } = await insforgeAdmin.database
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSystemAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    const isJobRecruiter = profile?.role === 'recruiter' && appData.jobs && (appData.jobs as any).recruiter_id === user.id;
    const isCandidateOwner = appData.candidate_id === user.id;

    if (!isSystemAdmin && !isJobRecruiter && !isCandidateOwner) {
      return new Response(JSON.stringify({ error: 'Forbidden. You do not have access to this resume.' }), { status: 403, headers: corsHeaders });
    }

    // 4. Log the access if it was accessed by a recruiter or admin
    if (isJobRecruiter) {
      await insforgeAdmin.database
        .from('resume_access_log')
        .insert([{
          application_id: applicationId,
          candidate_id: appData.candidate_id,
          recruiter_id: user.id,
          access_type: accessType,
          source: 'application',
        }]);
    } else if (isSystemAdmin) {
      await insforgeAdmin.database
        .from('resume_access_log')
        .insert([{
          application_id: applicationId,
          candidate_id: appData.candidate_id,
          recruiter_id: user.id,
          access_type: accessType,
          source: 'admin',
        }]);
    }

    // 5. Download resume from storage
    const snapshotKey = appData.resume_snapshot_key || `applications/${applicationId}/resume.pdf`;
    const { data: fileBlob, error: storageError } = await insforgeAdmin.storage
      .from('application-snapshots')
      .download(snapshotKey);

    if (storageError || !fileBlob) {
      console.error('[resume-proxy] Storage download failed:', storageError?.message);
      return new Response(JSON.stringify({ error: 'Resume snapshot file not found in storage.' }), { status: 404, headers: corsHeaders });
    }

    // Determine content type and filename based on snapshot key extension
    const keyLower = snapshotKey.toLowerCase();
    let contentType = 'application/pdf';
    let filename = 'resume.pdf';
    let isAttachment = accessType === 'downloaded';

    if (keyLower.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = 'resume.docx';
      isAttachment = true;
    } else if (keyLower.endsWith('.doc')) {
      contentType = 'application/msword';
      filename = 'resume.doc';
      isAttachment = true;
    }

    // 6. Return streamed file response
    return new Response(fileBlob, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': isAttachment ? `attachment; filename="${filename}"` : 'inline',
      },
    });
  } catch (err: any) {
    console.error('[resume-proxy] Unexpected error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}
