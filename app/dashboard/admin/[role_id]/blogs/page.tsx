"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

const IC = {
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
};

export default function AdminBlogsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push('/dashboard/candidate');
            return;
        }

        async function fetchBlogs() {
            try {
                const { data } = await insforge.database
                    .from('blog')
                    .select('*, author:profiles(name)')
                    .order('created_at', { ascending: false });
                setBlogs(data || []);
            } catch (err) {
                console.error('Fetch blogs error:', err);
            } finally {
                setLoading(false);
            }
        }

        if (user?.role === 'super_admin') fetchBlogs();
    }, [user, authLoading, router]);

    const handleStatusUpdate = async (blogId: string, newStatus: string) => {
        try {
            const { error } = await insforge.database
                .from('blog')
                .update({ status: newStatus })
                .eq('id', blogId);
            if (error) throw error;
            setBlogs(prev => prev.map(b => b.id === blogId ? { ...b, status: newStatus } : b));
        } catch (err) {
            console.error(err);
            alert('Failed to update blog status');
        }
    };

    const handleDelete = async (blogId: string) => {
        if (!confirm('Are you sure you want to delete this blog?')) return;
        try {
            const { error } = await insforge.database
                .from('blog')
                .delete()
                .eq('id', blogId);
            if (error) throw error;
            setBlogs(prev => prev.filter(b => b.id !== blogId));
        } catch (err) {
            console.error(err);
            alert('Failed to delete blog');
        }
    };

    if (authLoading || loading) return <div className={styles.loading}>Loading blogs...</div>;

    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Manage Blogs</h1>
                    <p className={styles.pageSub}>Write, edit and publish articles for the Talentmesh community.</p>
                </div>
                <Link href="/dashboard/admin/blogs/new" className={styles.primaryBtn}>
                    {IC.plus} Write Post
                </Link>
            </div>

            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {blogs.map(b => (
                            <tr key={b.id}>
                                <td style={{ fontWeight: 600 }}>{b.title}</td>
                                <td>{b.author?.name || 'Admin'}</td>
                                <td><span className={styles.chip}>{b.category}</span></td>
                                <td>
                                    <span className={`${styles.badge} ${b.status === 'published' ? styles.badgeActive : styles.badgePending}`}>
                                        {b.status}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link href={`/dashboard/admin/blogs/edit/${b.id}`} className={styles.secondaryBtn} style={{ padding: '0.4rem' }}>
                                            {IC.edit}
                                        </Link>
                                        {b.status === 'draft' ? (
                                            <button className={styles.successBtn} onClick={() => handleStatusUpdate(b.id, 'published')}>Publish</button>
                                        ) : (
                                            <button className={styles.secondaryBtn} onClick={() => handleStatusUpdate(b.id, 'draft')}>Unpublish</button>
                                        )}
                                        <button className={styles.dangerBtn} onClick={() => handleDelete(b.id)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
