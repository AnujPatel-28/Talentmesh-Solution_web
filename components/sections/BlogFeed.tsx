"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './sections.module.css'; // Using standard section styles

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

const MOCK_POSTS: BlogPost[] = [
    {
        id: 'mock-1',
        title: 'The Future of AI in Tech Recruitment',
        slug: 'future-of-ai-recruitment',
        excerpt: 'Discover how artificial intelligence is reshaping how companies discover and hire top engineering talent in 2026.',
        cover_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
        category: 'AI & Future',
        created_at: new Date().toISOString()
    },
    {
        id: 'mock-2',
        title: 'Developers Guide to Navigating the Modern Job Market',
        slug: 'dev-guide-modern-job-market',
        excerpt: 'Standing out requires more than just knowing React. Learn the soft skills and portfolio strategies that get noticed.',
        cover_image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
        category: 'Career Growth',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'mock-3',
        title: 'Why Salary Transparency Wins Top Talent',
        slug: 'salary-transparency-wins',
        excerpt: 'Data shows companies upfront about compensation see a 30% higher acceptance rate from senior candidates.',
        cover_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
        category: 'Hiring Insights',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    }
];

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
                setPosts(payload.blogs && payload.blogs.length > 0 ? payload.blogs : MOCK_POSTS);
            } catch (err) {
                console.error('Blog feed error:', err);
                setPosts(MOCK_POSTS);
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);

    if (loading) return null; // Or skeleton

    const isMockData = posts === MOCK_POSTS;

    return (
        <section className="premium-section" style={{ background: 'var(--background)' }}>
            <div className="premium-container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--alice-blue)', color: 'var(--primary-blue)', border: '1px solid var(--icy-blue)', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Knowledge Hub
                    </span>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '1rem', color: '#0f172a' }}>
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

                <div style={{ textAlign: 'center', marginTop: '4rem' }} className={styles.candidates}>
                    <Link href={isMockData ? "/login" : "/blog"} className={styles.segmentAction} style={{ textDecoration: 'none' }}>
                        View All Articles
                    </Link>
                </div>
            </div>
        </section>
    );
};
