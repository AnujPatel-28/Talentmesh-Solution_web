import { createClient } from 'npm:@insforge/sdk';
import { z } from 'npm:zod';

const blogFilterSchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['all', 'draft', 'published', 'archived']).optional(),
});

type BlogRecord = {
  id: string;
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
  cover_image?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  author_id?: string | null;
  author?: {
    name?: string | null;
  } | null;
};

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function getReadMinutes(content?: string | null) {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function serializeBlog(record: BlogRecord) {
  return {
    ...record,
    slug: record.slug || slugify(record.title),
    excerpt: record.excerpt || '',
    content: record.content || '',
    category: record.category || 'Technology',
    cover_image: record.cover_image || '',
    status: record.status || 'published',
    read_minutes: getReadMinutes(record.content),
    author: {
      name: record.author?.name || 'TalentMesh Editorial',
    },
  };
}

const INSFORGE_URL = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL');
const INSFORGE_ANON_KEY = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY');

export default async function(req: Request): Promise<Response> {
  const method = req.method;
  const rawOrigin = req.headers.get('origin') || req.headers.get('Origin');
  const origin = rawOrigin || 'http://localhost:3000';
  const allowedHeaders = req.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization, x-client-info';

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin, Access-Control-Request-Headers',
    'X-Debug-Version': 'antigravity-v8-hardcoded-fix'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Use the explicit public backend URL to avoid networking issues in the Edge Function environment
  // where localhost might not be reachable or correctly configured.
  const finalUrl = 'https://sytk3jgv.ap-southeast.insforge.app';
  const finalKey = INSFORGE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjA3OTd9.y20o7ymk12fdERo9hJpnv2rI5PjH8a9aaYnpcbTx5Yc';

  try {
    console.log('BLOGS FUNCTION INVOKED. URL:', INSFORGE_URL ? 'PRESENT' : 'MISSING', 'KEY:', INSFORGE_ANON_KEY ? 'PRESENT' : 'MISSING');
    
    if (!INSFORGE_URL || !INSFORGE_ANON_KEY) {
      console.error('SERVER CONFIG MISSING. URL:', INSFORGE_URL, 'KEY:', !!INSFORGE_ANON_KEY);
      throw new Error(`Server configuration error: URL is ${INSFORGE_URL || 'missing'}`);
    }

    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const validation = blogFilterSchema.safeParse(params);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid filters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const filters = validation.data;

    console.log(`[Blogs] Initializing client with explicit public URL: ${finalUrl}`);
    const client = createClient({ baseUrl: finalUrl, anonKey: finalKey });

    const page = filters.page || 0;
    const limit = filters.limit || 20;
    const start = page * limit;
    const end = start + limit - 1;

    console.log(`[Blogs] Querying database: page=${page}, limit=${limit}, range=${start}-${end}`);

    let query = client.database
      .from('blog')
      .select('id, title, slug, excerpt, content, category, cover_image, status, created_at, author_id')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
    }

    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query.range(start, end);

    if (error) {
      console.error('DATABASE ERROR:', error);
      throw new Error(`Failed to fetch blogs from DB: ${error.message}`);
    }

    const blogs = (data || []).map((entry) => serializeBlog(entry as BlogRecord));
    console.log(`Successfully fetched ${blogs.length} blogs`);

    return new Response(JSON.stringify({ blogs }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('BLOG FUNCTION EXCEPTION:', err);
    return new Response(JSON.stringify({ 
      error: err.message || 'Failed',
      details: err.stack || null,
      debug: { url: INSFORGE_URL, usedUrl: finalUrl, hasKey: !!INSFORGE_ANON_KEY }
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
