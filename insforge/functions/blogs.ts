import { z } from 'npm:zod';

console.log('[Blogs] Function Script Loading...');

const blogFilterSchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['all', 'draft', 'published', 'archived']).optional(),
});

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function getReadMinutes(content?: string | null): number {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function serializeBlog(record: any) {
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

const INSFORGE_URL = 'https://sytk3jgv.ap-southeast.insforge.app';
const INSFORGE_SERVICE_KEY = 'ik_1a616463854d5d7b3fef4c4bf7516aee';

export default async function(req: Request): Promise<Response> {
  const method = req.method;
  const rawOrigin = req.headers.get('origin') || req.headers.get('Origin');
  const origin = rawOrigin || '*';
  
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
    'X-Blog-Version': 'v10-internal-trace-2026-05-12'
  };

  console.log(`[Blogs] Request received: ${method} from ${origin}`);

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const validation = blogFilterSchema.safeParse(params);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid filters', details: validation.error }), { status: 400, headers: corsHeaders });
    }

    const filters = validation.data;
    const page = filters.page || 0;
    const limit = filters.limit || 20;
    const offset = page * limit;

    // Use a manual URL construction and log it clearly
    const dbPath = `/api/database/records/blog?select=id,title,slug,excerpt,content,category,cover_image,status,created_at,author_id&status=eq.published&order=created_at.desc&limit=${limit}&offset=${offset}`;
    const fullDbUrl = `${INSFORGE_URL}${dbPath}`;

    console.log(`[Blogs] Attempting DB Fetch: ${fullDbUrl}`);

    const response = await fetch(fullDbUrl, {
      method: 'GET',
      headers: {
        'apikey': INSFORGE_SERVICE_KEY,
        'Authorization': `Bearer ${INSFORGE_SERVICE_KEY}`,
        'Accept': 'application/json'
      }
    }).catch(fetchErr => {
      console.error('[Blogs] Fetch Call Failed Immediately:', fetchErr);
      throw new Error(`Network failure: ${fetchErr.message}`);
    });

    console.log(`[Blogs] DB Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Blogs] DB Error Body: ${errorText}`);
      throw new Error(`DB query failed with status ${response.status}`);
    }

    const data = await response.json();
    const blogs = (data || []).map(serializeBlog);

    console.log(`[Blogs] Success! Returning ${blogs.length} records`);

    return new Response(JSON.stringify({ blogs }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error('[Blogs] Critical Exception Handler:', err);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch blogs',
      message: err.message,
      trace: err.stack,
      config: { url: INSFORGE_URL }
    }), { status: 500, headers: corsHeaders });
  }
}
