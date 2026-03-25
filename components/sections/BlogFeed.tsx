"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './JobListings.module.css'; // Reusing similar grid styles if possible, or sections.module.css

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    cover_image: string;
    category: string;
    created_at: string;
}

const IconArrowRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

export const BlogFeed = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const response = await fetch('/api/blogs?limit=3', { cache: 'no-store' });
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload.error || 'Failed to fetch posts');
                }
                setPosts(payload.blogs || []);
            } catch (err) {
                console.error('Blog feed error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);

    if (loading) return null; // Or skeleton
    if (posts.length === 0) return null;

    return (
        <section className="premium-section" style={{ background: '#f8fafc' }}>
            <div className="premium-container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <span style={{ color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Knowledge Hub
                    </span>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem', color: '#0f172a' }}>
                        Latest from the <span className="text-gradient">Blog.</span>
                    </h2>
                    <p style={{ color: '#64748b', marginTop: '1rem', maxWidth: '600px', margin: '1rem auto 0' }}>
                        Stay updated with the latest trends in AI recruitment, career growth, and talent acquisition.
                    </p>
                </div>

                <div className="premium-grid-3">
                    {posts.map(post => (
                        <Link href={`/blog/${post.slug}`} key={post.id} style={{ textDecoration: 'none' }}>
                            <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                                    <Image 
                                        src={post.cover_image || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d'} 
                                        alt={post.title} 
                                        fill 
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <span style={{ 
                                        position: 'absolute', 
                                        top: '1rem', 
                                        left: '1rem', 
                                        background: 'rgba(255,255,255,0.9)', 
                                        padding: '0.3rem 0.8rem', 
                                        borderRadius: '20px', 
                                        fontSize: '0.7rem', 
                                        fontWeight: 700,
                                        color: '#0f172a'
                                    }}>
                                        {post.category}
                                    </span>
                                </div>
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                                        {post.title}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', lineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {post.excerpt}
                                    </p>
                                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.9rem' }}>
                                        Read More <IconArrowRight />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <Link href="/blog" className="secondaryBtn" style={{ padding: '0.8rem 2rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff' }}>
                        View All Articles
                    </Link>
                </div>
            </div>
        </section>
    );
};
