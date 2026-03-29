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

export async function getBlogBySlug(slug: string) {
  const { data, error } = await insforge.database
    .from('blog')
    .select('*, profiles:author_id(name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) return null;
  return data;
}

export async function getPublishedBlogs(limit = 10) {
  const { data, error } = await insforge.database
    .from('blog')
    .select('*, profiles:author_id(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}
