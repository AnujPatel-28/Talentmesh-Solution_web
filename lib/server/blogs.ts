import { insforgeAdmin } from '@/lib/insforge-admin';
import type { BlogFilterInput, CreateBlogInput, UpdateBlogInput } from '@/lib/validation/blogs';

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

function requireAdminClient() {
  if (!insforgeAdmin) {
    throw new Error('Admin client not initialized');
  }

  return insforgeAdmin;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function ensureUniqueSlug(baseTitle: string, excludeId?: string) {
  const client = requireAdminClient();
  const baseSlug = slugify(baseTitle) || 'article';
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    let query = client.database
      .from('blog')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);
    if (error) {
      throw new Error(`Failed to validate slug: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
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
    status: record.status || 'draft',
    read_minutes: getReadMinutes(record.content),
    author: {
      name: record.author?.name || 'TalentMesh Editorial',
    },
  };
}

export async function listPublicBlogs(filters: Partial<BlogFilterInput> = {}) {
  const client = requireAdminClient();
  const page = filters.page || 0;
  const limit = filters.limit || 20;
  const start = page * limit;
  const end = start + limit - 1;

  let query = client.database
    .from('blog')
    .select('id, title, slug, excerpt, content, category, cover_image, status, created_at, updated_at, author_id, author:profiles(name)')
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

  return (data || []).map((entry) => serializeBlog(entry as BlogRecord));
}

export async function getPublicBlogBySlug(slug: string) {
  const client = requireAdminClient();
  const { data, error } = await client.database
    .from('blog')
    .select('id, title, slug, excerpt, content, category, cover_image, status, created_at, updated_at, author_id, author:profiles(name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    throw new Error('Blog not found');
  }

  return serializeBlog(data as BlogRecord);
}

export async function listAdminBlogs(filters: Partial<BlogFilterInput> = {}) {
  const client = requireAdminClient();
  const page = filters.page || 0;
  const limit = filters.limit || 20;
  const start = page * limit;
  const end = start + limit - 1;

  let query = client.database
    .from('blog')
    .select('id, title, slug, excerpt, content, category, cover_image, status, created_at, updated_at, author_id, author:profiles(name)')
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
  }

  if (filters.category && filters.category !== 'All') {
    query = query.eq('category', filters.category);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query.range(start, end);
  if (error) {
    throw new Error(`Failed to fetch admin blogs: ${error.message}`);
  }

  return (data || []).map((entry) => serializeBlog(entry as BlogRecord));
}

export async function getAdminBlog(id: string) {
  const client = requireAdminClient();
  const { data, error } = await client.database
    .from('blog')
    .select('id, title, slug, excerpt, content, category, cover_image, status, created_at, updated_at, author_id, author:profiles(name)')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('Blog not found');
  }

  return serializeBlog(data as BlogRecord);
}

export async function createAdminBlog(input: CreateBlogInput, adminId: string) {
  const client = requireAdminClient();
  const slug = await ensureUniqueSlug(input.title);
  const payload = {
    ...input,
    slug,
    cover_image: input.cover_image || null,
    author_id: input.author_id || adminId,
    status: input.status || 'draft',
  };

  const { data, error } = await client.database
    .from('blog')
    .insert(payload)
    .select('id, title, slug, excerpt, content, category, cover_image, status, created_at, updated_at, author_id, author:profiles(name)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create blog: ${error?.message || 'Unknown error'}`);
  }

  return serializeBlog(data as BlogRecord);
}

export async function updateAdminBlog(id: string, input: UpdateBlogInput) {
  const client = requireAdminClient();
  const payload: Record<string, unknown> = {
    ...input,
    cover_image: input.cover_image === '' ? null : input.cover_image,
  };

  if (input.title) {
    payload.slug = await ensureUniqueSlug(input.title, id);
  }

  const { data, error } = await client.database
    .from('blog')
    .update(payload)
    .eq('id', id)
    .select('id, title, slug, excerpt, content, category, cover_image, status, created_at, updated_at, author_id, author:profiles(name)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update blog: ${error?.message || 'Unknown error'}`);
  }

  return serializeBlog(data as BlogRecord);
}

export async function setAdminBlogState(id: string, action: 'publish' | 'unpublish' | 'delete') {
  const client = requireAdminClient();
  const stateMap = {
    publish: { status: 'published' },
    unpublish: { status: 'draft' },
    delete: { status: 'deleted' },
  } as const;

  const { data, error } = await client.database
    .from('blog')
    .update(stateMap[action])
    .eq('id', id)
    .select('id, title, slug, excerpt, content, category, cover_image, status, created_at, updated_at, author_id, author:profiles(name)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update blog status: ${error?.message || 'Unknown error'}`);
  }

  return serializeBlog(data as BlogRecord);
}
