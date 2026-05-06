import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const jobFilterSchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  industry: z.string().optional(),
  date_posted: z.enum(['all', '24h', '7d', '30d']).optional(),
});

const jobCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  requirements: z.array(z.string()).optional(),
  skills_required: z.array(z.string()).optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  department: z.string().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  currency: z.string().default('INR'),
  experience_min: z.number().optional(),
  experience_max: z.number().optional(),
  company_id: z.string().uuid(),
});

type JobRecord = {
  id: string;
  title: string;
  description: string;
  requirements?: string[] | null;
  skills_required?: string[] | null;
  type?: string | null;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  experience_min?: number | null;
  experience_max?: number | null;
  department?: string | null;
  status?: string | null;
  is_approved?: boolean | null;
  views_count?: number | null;
  applications_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  company_id?: string | null;
  recruiter_id?: string | null;
  companies?: {
    id?: string | null;
    name?: string | null;
    logo_url?: string | null;
    industry?: string | null;
    about?: string | null;
    website?: string | null;
  } | null;
};

function getPostedDays(createdAt?: string | null) {
  if (!createdAt) return 0;
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return 0;
  return Math.max(0, Math.floor((Date.now() - createdTime) / 86400000));
}

function formatSalary(min?: number | null, max?: number | null, currency?: string | null) {
  if (!min && !max) return 'Competitive';
  const symbol = currency === 'USD' ? '$' : 'Rs';
  if (min && max) return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  if (min) return `${symbol}${min.toLocaleString()}+`;
  return `${symbol}${(max || 0).toLocaleString()}`;
}

function getInitials(name?: string | null) {
  if (!name) return 'TM';
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function getBrandColor(seed: string) {
  const palette = ['#0D47A1', '#1565C0', '#1E88E5', '#42A5F5', '#0F766E', '#D97706'];
  const index = seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

function serializeJob(record: JobRecord) {
  const companyName = record.companies?.name || 'TalentMesh Company';
  const brandColor = getBrandColor(companyName);

  return {
    ...record,
    type: record.type || 'Full-Time',
    location: record.location || 'Remote',
    currency: record.currency || 'INR',
    requirements: record.requirements || [],
    skills_required: record.skills_required || [],
    department: record.department || '',
    views_count: record.views_count || 0,
    applications_count: record.applications_count || 0,
    posted_days: getPostedDays(record.created_at),
    salary: formatSalary(record.salary_min, record.salary_max, record.currency),
    ai_match_rate: 85,
    company_profiles: {
      id: record.companies?.id || record.company_id || null,
      company_name: companyName,
      logo_url: record.companies?.logo_url || null,
      industry: record.companies?.industry || null,
      about: record.companies?.about || null,
      website: record.companies?.website || null,
      initials: getInitials(companyName),
      color: brandColor,
    },
    companies: {
      id: record.companies?.id || record.company_id || null,
      name: companyName,
      logo_url: record.companies?.logo_url || null,
      industry: record.companies?.industry || null,
      about: record.companies?.about || null,
      website: record.companies?.website || null,
    },
  };
}

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || '*';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  try {
    const insforge = createClient({ baseUrl, anonKey, edgeFunctionToken: token, isServerMode: true });

    if (req.method === 'POST') {
      if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }

      const { data: { user }, error: userError } = await insforge.auth.getCurrentUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: corsHeaders });
      }

      const body = await req.json();
      const validation = jobCreateSchema.safeParse(body);
      
      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'Validation failed', details: validation.error.flatten() }), { status: 400, headers: corsHeaders });
      }

      const { data: newJob, error: insertError } = await insforge.database
        .from('jobs')
        .insert([{
          ...validation.data,
          recruiter_id: user.id,
          status: 'draft',
          is_approved: false
        }])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create job: ${insertError.message}`);
      }

      return new Response(JSON.stringify(newJob), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const params = Object.fromEntries(url.searchParams.entries());
      const validation = jobFilterSchema.safeParse(params);

      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'Invalid query parameters', details: validation.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const filters = validation.data;
      const page = filters.page || 0;
      const limit = filters.limit || 20;
      const start = page * limit;
      const end = start + limit - 1;

      let query = insforge.database
        .from('jobs')
        .select('id, title, description, requirements, skills_required, type, location, salary_min, salary_max, currency, experience_min, experience_max, department, status, is_approved, views_count, applications_count, created_at, updated_at, company_id, recruiter_id, companies:company_profiles(id, name, logo_url, industry, about, website)', { count: 'exact' })
        .eq('is_approved', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.salary_min) {
        query = query.gte('salary_min', filters.salary_min);
      }
      if (filters.salary_max) {
        query = query.lte('salary_max', filters.salary_max);
      }
      if (filters.industry) {
        // This is a bit tricky with PostgREST join filtering, usually done via dot notation
        query = query.filter('company_profiles.industry', 'eq', filters.industry);
      }
      if (filters.date_posted && filters.date_posted !== 'all') {
        const now = new Date();
        if (filters.date_posted === '24h') now.setHours(now.getHours() - 24);
        else if (filters.date_posted === '7d') now.setDate(now.getDate() - 7);
        else if (filters.date_posted === '30d') now.setDate(now.getDate() - 30);
        query = query.gte('created_at', now.toISOString());
      }

      const { data, error, count } = await query.range(start, end);
      if (error) {
        throw new Error(`Failed to fetch jobs: ${error.message}`);
      }

      const jobs = (data || []).map((job) => serializeJob(job as JobRecord));

      return new Response(JSON.stringify({
        data: jobs,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasMore: (page + 1) * limit < (count || 0),
        }
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });

  } catch (err: any) {
    console.error('Jobs Edge Function Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
