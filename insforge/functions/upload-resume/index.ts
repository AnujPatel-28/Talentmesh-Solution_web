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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return new Response(JSON.stringify({ error: 'Missing file or userId' }), { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return new Response(JSON.stringify({ error: 'Only PDF files are allowed' }), { status: 400 });
    }

    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });

    const path = `${userId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await insforge.storage
      .from('resumes')
      .upload(path, file as any);

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
    }

    const publicUrl = uploadData?.url;

    // Update profile with resume URL
    const { error: dbError } = await insforge.database
      .from('candidate_profiles')
      .update({ resume_url: publicUrl })
      .eq('id', userId);

    if (dbError) {
      return new Response(JSON.stringify({ error: dbError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ url: publicUrl }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Upload Edge Function Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
