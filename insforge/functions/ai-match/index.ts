import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  try {
    const { jobId, candidateId } = await req.json();

    if (!jobId || !candidateId) {
      return new Response(JSON.stringify({ error: 'jobId and candidateId required' }), { status: 400, headers: corsHeaders });
    }

    const insforgeAdmin = createClient({ baseUrl, anonKey: serviceKey });

    // Fetch Job
    const { data: job, error: jobError } = await insforgeAdmin.database
      .from('jobs')
      .select('title, description, skills_required, requirements, location, type, experience_min, experience_max')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404, headers: corsHeaders });
    }

    // Fetch Candidate
    const { data: profile } = await insforgeAdmin.database
      .from('profiles')
      .select('name, about, location')
      .eq('id', candidateId)
      .single();

    const { data: candidate, error: candError } = await insforgeAdmin.database
      .from('candidate_profiles')
      .select('skills, experience_years, education, headline')
      .eq('user_id', candidateId)
      .single();

    if (candError || !candidate) {
      return new Response(JSON.stringify({ error: 'Candidate profile not found' }), { status: 404, headers: corsHeaders });
    }

    const prompt = `
      You are an expert technical recruiter. Match the following candidate to the job description.
      
      JOB DESCRIPTION:
      Title: ${job.title}
      Location: ${job.location}
      Type: ${job.type}
      Required Skills: ${job.skills_required?.join(', ')}
      Experience Required: ${job.experience_min}-${job.experience_max} years
      Description: ${job.description}
      Requirements: ${job.requirements?.join('. ')}

      CANDIDATE PROFILE:
      Name: ${profile?.name}
      Headline: ${candidate.headline}
      Location: ${profile?.location}
      Skills: ${candidate.skills?.join(', ')}
      Experience: ${candidate.experience_years} years
      Education: ${candidate.education}
      Bio: ${profile?.about}

      Return a JSON object:
      {
        "score": number (0-100),
        "reasons": [string] (top 3 key matching or missing factors),
        "match_level": "low" | "medium" | "high" | "perfect"
      }
    `;

    const { data: aiResponse, error: aiError } = await insforgeAdmin.ai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: prompt }],
      // @ts-ignore: response_format might not be in older SDK types but is supported by the backend
      response_format: { type: 'json_object' }
    });

    if (aiError) {
      return new Response(JSON.stringify({ error: aiError.message }), { status: 500, headers: corsHeaders });
    }

    const content = aiResponse.choices[0].message.content;
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err: any) {
    console.error('AI Match Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
