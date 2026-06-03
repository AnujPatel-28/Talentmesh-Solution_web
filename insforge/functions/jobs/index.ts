import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const jobFilterSchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  date_posted: z.enum(['all', '24h', '7d', '30d']).optional(),
});

const jobCreateSchema = z.object({
  title: z.string().min(3),
  company_name: z.string().min(2),
  category: z.string(),
  type: z.string(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  location: z.string().optional(),
  description: z.string().min(10),
  requirements: z.array(z.string()).optional(),
  openings: z.number().min(1).default(1),
  deadline: z.string().optional(),
  company_id: z.string().uuid(),
  recruiter_id: z.string().uuid().optional(),
});

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;
const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY');

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || '*';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  // --- GET Handler ---
  if (req.method === 'GET') {
    try {
      const reqBaseUrl = req.headers.get('x-insforge-url') || baseUrl;
      const reqAnonKey = req.headers.get('x-insforge-anon-key') || anonKey;
      const reqServiceKey = req.headers.get('x-insforge-service-key') || serviceKey || reqAnonKey;
      
      const dbClient = createClient({ 
        baseUrl: reqBaseUrl, 
        anonKey: reqServiceKey,
        isServerMode: true
      });
      const url = new URL(req.url);
      const params = Object.fromEntries(url.searchParams.entries());
      const validation = jobFilterSchema.safeParse(params);

      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'Invalid query parameters', details: validation.error.flatten().fieldErrors }), { status: 400, headers: corsHeaders });
      }

      const filters = validation.data;
      const page = filters.page || 0;
      const limit = filters.limit || 20;
      const start = page * limit;
      const end = start + limit - 1;

      let query = dbClient.database
        .from('jobs')
        .select('*, companies(id, name, logo_url, industry, about:description, website)', { count: 'exact' })
        .eq('is_approved', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
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
      if (filters.date_posted && filters.date_posted !== 'all') {
        const now = new Date();
        if (filters.date_posted === '24h') now.setHours(now.getHours() - 24);
        else if (filters.date_posted === '7d') now.setDate(now.getDate() - 7);
        else if (filters.date_posted === '30d') now.setDate(now.getDate() - 30);
        query = query.gte('created_at', now.toISOString());
      }

      const { data, error, count } = await query.range(start, end);
      if (error) throw error;

      return new Response(JSON.stringify({
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        }
      }), { status: 200, headers: corsHeaders });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  // --- POST Handler (Create Job) ---
  if (req.method === 'POST') {
    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

      const reqBaseUrl = req.headers.get('x-insforge-url') || baseUrl;
      const reqAnonKey = req.headers.get('x-insforge-anon-key') || anonKey;
      const reqServiceKey = req.headers.get('x-insforge-service-key') || serviceKey || reqAnonKey;
      
      const dbClient = createClient({ 
        baseUrl: reqBaseUrl, 
        anonKey: reqServiceKey,
        isServerMode: true
      });
      const body = await req.json();
      const validation = jobCreateSchema.safeParse(body);
      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'Validation failed', details: validation.error.flatten().fieldErrors }), { status: 400, headers: corsHeaders });
      }

      const { data, error } = await dbClient.database
        .from('jobs')
        .insert([{
          ...validation.data,
          status: 'active',
          is_approved: false
        }])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ job: data }), { status: 201, headers: corsHeaders });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
}
