"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

export default function NewBlogPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        category: 'Technology',
        excerpt: '',
        content: '',
        status: 'draft',
        cover_image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=1000'
    });

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push('/dashboard/candidate');
        }
    }, [user, authLoading, router]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, title, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) return alert('Title and content are required');
        
        setSubmitting(true);
        try {
            const { error } = await insforge.database
                .from('blog')
                .insert([{
                    ...formData,
                    author_id: user?.id
                }]);
            
            if (error) throw error;
            router.push('/dashboard/admin/blogs');
        } catch (err) {
            console.error(err);
            alert('Failed to save blog post');
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Create New Post</h1>
                    <p className={styles.pageSub}>Craft a compelling story for the Talentmesh audience.</p>
                </div>
            </div>

            <form className={styles.card} onSubmit={handleSubmit} style={{ gap: '1.5rem', padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Article Title</label>
                        <input 
                            type="text" 
                            className={styles.searchBar} 
                            style={{ width: '100%', padding: '0.75rem' }}
                            placeholder="e.g. The Future of AI in Hiring" 
                            value={formData.title}
                            onChange={handleTitleChange}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>URL Slug</label>
                        <input 
                            type="text" 
                            className={styles.searchBar} 
                            style={{ width: '100%', padding: '0.75rem', background: '#f8fafc' }}
                            placeholder="future-of-ai-hiring" 
                            value={formData.slug}
                            onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Category</label>
                        <select 
                            className={styles.filterBtn} 
                            style={{ width: '100%', padding: '0.7rem' }}
                            value={formData.category}
                            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        >
                            <option>Technology</option>
                            <option>Culture</option>
                            <option>Career Advice</option>
                            <option>Engineering</option>
                            <option>Product</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Status</label>
                        <select 
                            className={styles.filterBtn} 
                            style={{ width: '100%', padding: '0.7rem' }}
                            value={formData.status}
                            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="draft">Draft (Hidden)</option>
                            <option value="published">Published (Live)</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Short Excerpt</label>
                    <textarea 
                        className={styles.searchBar} 
                        style={{ width: '100%', padding: '0.75rem', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                        placeholder="Brief summary of the article..." 
                        value={formData.excerpt}
                        onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Content (Markdown Supported)</label>
                    <textarea 
                        className={styles.searchBar} 
                        style={{ width: '100%', padding: '1rem', minHeight: '300px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                        placeholder="Write your article here..." 
                        value={formData.content}
                        onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        required
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button 
                        type="button" 
                        className={styles.secondaryBtn} 
                        onClick={() => router.back()}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className={styles.primaryBtn}
                        disabled={submitting}
                    >
                        {submitting ? 'Saving...' : 'Save Article'}
                    </button>
                </div>
            </form>
        </div>
    );
}
