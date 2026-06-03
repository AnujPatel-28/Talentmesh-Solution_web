import { createClient } from 'npm:@insforge/sdk';

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
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Job ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const baseUrl = req.headers.get('x-insforge-url') || Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
    const anonKey = req.headers.get('x-insforge-anon-key') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
    const serviceKey = req.headers.get('x-insforge-service-key') || Deno.env.get('INSFORGE_SERVICE_KEY') || anonKey;
    
    const client = createClient({ 
      baseUrl, 
      anonKey: serviceKey,
      isServerMode: true
    });

    const { data, error } = await client.database
      .from('jobs')
      .select('id, title, description, requirements, skills_required, type, location, salary_min, salary_max, currency, experience_min, experience_max, department, status, is_approved, views_count, applications_count, created_at, updated_at, company_id, recruiter_id, companies(id, name, logo_url, industry, about:description, website)')
      .eq('id', id)
      .eq('is_approved', true)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Job not found', details: error }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const job = serializeJob(data as unknown as JobRecord);
    return new Response(JSON.stringify({ job }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    const status = err.message === 'Job not found' ? 404 : 500;
    return new Response(JSON.stringify({ error: err.message || 'Failed to load job' }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}
