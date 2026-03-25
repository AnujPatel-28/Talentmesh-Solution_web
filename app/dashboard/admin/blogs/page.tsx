'use client';

import { useEffect, useMemo, useState } from 'react';

import styles from './blogs.module.css';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  status: string;
  cover_image?: string;
  created_at?: string;
  author?: {
    name?: string | null;
  };
};

type BlogFormState = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image: string;
  status: string;
};

const defaultFormState: BlogFormState = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Technology',
  cover_image: '',
  status: 'draft',
};

const categoryOptions = ['Technology', 'Culture', 'Career Advice', 'Engineering', 'Product', 'AI Recruitment'];
const statusOptions = ['all', 'draft', 'published', 'archived', 'deleted'];

function toFormState(post?: BlogPost | null): BlogFormState {
  if (!post) {
    return defaultFormState;
  }

  return {
    title: post.title || '',
    excerpt: post.excerpt || '',
    content: post.content || '',
    category: post.category || 'Technology',
    cover_image: post.cover_image || '',
    status: post.status || 'draft',
  };
}

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogFormState>(defaultFormState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const summary = useMemo(() => ({
    total: posts.length,
    published: posts.filter((post) => post.status === 'published').length,
    drafts: posts.filter((post) => post.status === 'draft').length,
  }), [posts]);

  const fetchPosts = async (currentSearch = search, currentStatus = status) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        search: currentSearch,
        status: currentStatus,
        page: '0',
        limit: '50',
      });

      const response = await fetch(`/api/admin/blogs?${params.toString()}`, { credentials: 'include' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load blogs');
      }

      setPosts(payload.blogs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleChange = (field: keyof BlogFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setSelectedPost(null);
    setForm(defaultFormState);
    setError('');
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setForm(toFormState(post));
    setSuccess('');
    setError('');
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchPosts(search, status);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(selectedPost ? `/api/admin/blogs/${selectedPost.id}` : '/api/admin/blogs', {
        method: selectedPost ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save blog');
      }

      setSelectedPost(null);
      setForm(defaultFormState);
      setSuccess(selectedPost ? 'Blog updated successfully.' : 'Blog created successfully.');
      await fetchPosts();
    } catch (err: any) {
      setError(err.message || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (postId: string, action: 'publish' | 'unpublish' | 'delete') => {
    const actionLabels = {
      publish: 'published',
      unpublish: 'moved back to draft',
      delete: 'deleted',
    } as const;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/blogs/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || `Failed to ${action} blog`);
      }

      setSuccess(`Blog ${actionLabels[action]} successfully.`);
      await fetchPosts();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} blog`);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Super Admin Blogs</p>
          <h1 className={styles.title}>Write, schedule, and control every article that appears on TalentMesh.</h1>
          <p className={styles.subtitle}>Published posts flow into the blog hub, navbar-linked pages, and homepage content feed automatically.</p>
        </div>
        <button className={styles.secondaryButton} onClick={resetForm}>
          New Article
        </button>
      </div>

      <div className={styles.stats}>
        <StatCard label="Total Articles" value={summary.total} />
        <StatCard label="Published" value={summary.published} />
        <StatCard label="Drafts" value={summary.drafts} />
      </div>

      {(error || success) && (
        <div className={error ? styles.errorBanner : styles.successBanner}>
          {error || success}
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.listPanel}>
          <form className={styles.toolbar} onSubmit={handleSearchSubmit}>
            <input
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or excerpt"
            />
            <select
              className={styles.select}
              value={status}
              onChange={(event) => {
                const nextStatus = event.target.value;
                setStatus(nextStatus);
                fetchPosts(search, nextStatus);
              }}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All statuses' : option}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.primaryButton}>
              Refresh
            </button>
          </form>

          <div className={styles.listBody}>
            {loading ? (
              <div className={styles.emptyState}>Loading blogs...</div>
            ) : posts.length === 0 ? (
              <div className={styles.emptyState}>No blog posts match the current filters.</div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <div>
                      <h2 className={styles.postTitle}>{post.title}</h2>
                      <p className={styles.postMeta}>
                        {post.category} · {post.slug} · {post.author?.name || 'TalentMesh Editorial'}
                      </p>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status_${post.status}`] || ''}`}>
                      {post.status}
                    </span>
                  </div>

                  <p className={styles.postExcerpt}>{post.excerpt}</p>

                  <div className={styles.actions}>
                    <button className={styles.secondaryButton} onClick={() => handleEdit(post)}>
                      Edit
                    </button>
                    {post.status !== 'published' ? (
                      <button className={styles.primaryButton} onClick={() => handleAction(post.id, 'publish')}>
                        Publish
                      </button>
                    ) : (
                      <button className={styles.secondaryButton} onClick={() => handleAction(post.id, 'unpublish')}>
                        Unpublish
                      </button>
                    )}
                    <button className={styles.deleteButton} onClick={() => handleAction(post.id, 'delete')}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2>{selectedPost ? 'Edit Article' : 'Create Article'}</h2>
            <p>Write content in plain text with optional Markdown-style headings like `#`, `##`, and bullet lines. Rendering stays safe and escaped on the public site.</p>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <label className={styles.field}>
              <span>Title</span>
              <input className={styles.input} value={form.title} onChange={(event) => handleChange('title', event.target.value)} required />
            </label>

            <div className={styles.twoColumn}>
              <label className={styles.field}>
                <span>Category</span>
                <select className={styles.select} value={form.category} onChange={(event) => handleChange('category', event.target.value)}>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Status</span>
                <select className={styles.select} value={form.status} onChange={(event) => handleChange('status', event.target.value)}>
                  {statusOptions.filter((option) => option !== 'all').map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className={styles.field}>
              <span>Cover Image URL</span>
              <input className={styles.input} value={form.cover_image} onChange={(event) => handleChange('cover_image', event.target.value)} placeholder="https://..." />
            </label>

            <label className={styles.field}>
              <span>Excerpt</span>
              <textarea className={styles.textareaSmall} value={form.excerpt} onChange={(event) => handleChange('excerpt', event.target.value)} required />
            </label>

            <label className={styles.field}>
              <span>Content</span>
              <textarea className={styles.textarea} value={form.content} onChange={(event) => handleChange('content', event.target.value)} required />
            </label>

            <div className={styles.formActions}>
              <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                Clear
              </button>
              <button type="submit" className={styles.primaryButton} disabled={saving}>
                {saving ? 'Saving...' : selectedPost ? 'Update Article' : 'Create Article'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
