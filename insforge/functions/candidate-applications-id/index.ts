import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'You must be logged in to continue.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });
  const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

  if (authError || !authData?.user || authData.user.id === 'project-admin-with-api-key') {
    return new Response(JSON.stringify({ error: 'You must be logged in to continue.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

  // Get user role
  const { data: profile } = await insforgeAdmin.database
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'recruiter') {
    return new Response(JSON.stringify({ error: 'Only candidates can perform this action.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const candidateId = authData.user.id;
  const url = new URL(req.url);
  const applicationId = url.searchParams.get('id');

  if (!applicationId) {
    return new Response(JSON.stringify({ error: 'Application ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { data: existing, error: existingError } = await insforgeAdmin.database
      .from('applications')
      .select('id, status')
      .eq('id', applicationId)
      .eq('candidate_id', candidateId)
      .single();

    if (existingError || !existing) {
      return new Response(JSON.stringify({ error: 'Application not found.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (existing.status === 'withdrawn') {
      return new Response(JSON.stringify({ id: applicationId, status: 'withdrawn' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const { data, error } = await insforgeAdmin.database
      .from('applications')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .eq('candidate_id', candidateId)
      .select('id, status')
      .single();

    if (error || !data) {
      throw new Error(`Failed to withdraw application: ${error?.message || 'Unknown error'}`);
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to withdraw application' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
