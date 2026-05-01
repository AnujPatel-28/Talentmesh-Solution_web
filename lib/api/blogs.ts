import { insforge } from '@/lib/insforge';

/**
 * lib/api/blogs.ts
 * Logic for fetching blogs for both public and admin views.
 */

export async function getAllBlogsForAdmin() {
  const { data, error } = await insforge.database
    .from('blog')
    .select('*, profiles:author_id(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Helper to build a URL with query parameters for Edge Functions
 */
function buildUrl(slug: string, params: Record<string, any>): string {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
  );
  const query = new URLSearchParams(cleanParams as any).toString();
  return query ? `${slug}?${query}` : slug;
}

/**
 * Fetch a single blog post by slug via Edge Function
 */
export async function getBlogBySlug(slug: string) {
  const { data, error } = await insforge.functions.invoke(`blogs-slug?slug=${slug}`, {
    method: 'GET'
  });

  if (error) {
    if (error.statusCode === 404) return null;
    return null;
  }
  return data?.blog;
}

/**
 * Fetch published blogs via Edge Function
 */
export async function getPublishedBlogs(filters: { search?: string; category?: string; page?: number; limit?: number } = {}) {
  const { data, error } = await insforge.functions.invoke(buildUrl('blogs', filters), {
    method: 'GET'
  });

  if (error) throw new Error(error.message);
  return data?.blogs || [];
}

