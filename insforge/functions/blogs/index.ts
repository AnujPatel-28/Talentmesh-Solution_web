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

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL');
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY');

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
    'X-Debug-Version': 'antigravity-v5'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    if (!baseUrl || !anonKey) {
      throw new Error('Server configuration error');
    }

    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const validation = blogFilterSchema.safeParse(params);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid filters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const filters = validation.data;
    const client = createClient({ baseUrl, anonKey });

    const page = filters.page || 0;
    const limit = filters.limit || 20;
    const start = page * limit;
    const end = start + limit - 1;

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
      throw new Error(`Failed to fetch blogs: ${error.message}`);
    }

    const blogs = (data || []).map((entry) => serializeBlog(entry as BlogRecord));

    return new Response(JSON.stringify({ blogs }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('BLOG FUNCTION EXCEPTION:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
