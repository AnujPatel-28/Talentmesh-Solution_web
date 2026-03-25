"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../blog.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { SafeBlogContent } from '@/components/blog/SafeBlogContent';

const IconArrowLeft = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5m7-7-7 7 7 7" />
    </svg>
);

const IconArrowRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

export default function BlogDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [related, setRelated] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPost() {
            try {
                const [postResponse, relatedResponse] = await Promise.all([
                    fetch(`/api/blogs/${slug}`, { cache: 'no-store' }),
                    fetch('/api/blogs?limit=12', { cache: 'no-store' }),
                ]);
                const postPayload = await postResponse.json();
                const relatedPayload = await relatedResponse.json();

                if (!postResponse.ok || !postPayload.blog) {
                    throw new Error('Not found');
                }

                setPost(postPayload.blog);
                setRelated(
                    (relatedPayload.blogs || [])
                        .filter((entry: any) => entry.id !== postPayload.blog.id && entry.category === postPayload.blog.category)
                        .slice(0, 3),
                );
            } catch (err) {
                console.error(err);
                router.push('/blog');
            } finally {
                setLoading(false);
            }
        }
        if (slug) fetchPost();
    }, [slug, router]);

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTopColor: '#007BFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!post) return null;

    return (
        <main style={{ background: '#fff', minHeight: '100vh', paddingBottom: '6rem' }}>
            <div className="premium-container" style={{ paddingTop: '2rem' }}>
                <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                    <IconArrowLeft /> Back to Blog
                </button>
            </div>

            <article>
                <header className="premium-container" style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <AnimateOnScroll animation="fadeUp">
                        <span style={{ color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {post.category}
                        </span>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0f172a', lineHeight: '1.2', maxWidth: '900px', margin: '1rem auto' }}>
                            {post.title}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2rem', color: '#64748b', fontSize: '0.9rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'var(--primary-blue)', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                {post.author?.name?.charAt(0) || 'A'}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{post.author?.name || 'TalentMesh Editorial'}</div>
                                <div>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · {post.read_minutes || 5} min read</div>
                            </div>
                        </div>
                    </AnimateOnScroll>
                </header>

                <AnimateOnScroll animation="fadeUp" delay={100}>
                    <div className="premium-container" style={{ marginTop: '4rem' }}>
                        <div style={{ position: 'relative', width: '100%', height: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                            <Image
                                src={post.cover_image || "/images/tech-office.jpg"}
                                alt={post.title}
                                fill
                                style={{ objectFit: 'cover' }}
                                priority
                            />
                        </div>
                    </div>
                </AnimateOnScroll>

                <div className="premium-container" style={{ marginTop: '5rem', maxWidth: '800px' }}>
                    <AnimateOnScroll animation="fadeUp" delay={200}>
                        <div style={{ fontSize: '1.15rem', color: '#334155', lineHeight: '1.8', fontFamily: 'var(--font-inter)' }}>
                            <SafeBlogContent content={post.content || ''} />
                        </div>
                    </AnimateOnScroll>
                </div>
            </article>

            {related.length > 0 && (
                <section style={{ marginTop: '10rem', background: '#f8fafc', padding: '6rem 0' }}>
                    <div className="premium-container">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Related Articles</h2>
                            <Link href="/blog" style={{ color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'none' }}>View All</Link>
                        </div>
                        <div className="premium-grid-3">
                            {related.map(rel => (
                                <Link href={`/blog/${rel.slug}`} key={rel.id} style={{ textDecoration: 'none' }}>
                                    <div className="glass-card" style={{ background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ position: 'relative', height: '180px' }}>
                                            <Image src={rel.cover_image || "/images/tech-office.jpg"} alt={rel.title} fill style={{ objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ padding: '1.5rem' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase' }}>{rel.category}</span>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>{rel.title}</h3>
                                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.8rem' }}>
                                                Read More <IconArrowRight />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <div className="premium-container" style={{ marginTop: '8rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)', borderRadius: '32px', padding: '4rem', textAlign: 'center', color: '#fff' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Enjoyed this article?</h2>
                    <p style={{ marginTop: '1rem', color: '#cbd5e1', fontSize: '1.1rem' }}>Subscribe to our newsletter and never miss an update on AI recruitment.</p>
                    <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <input type="email" placeholder="your@email.com" style={{ padding: '1rem 1.5rem', borderRadius: '12px', border: 'none', width: '100%', maxWidth: '300px', fontSize: '1rem' }} />
                        <button style={{ padding: '1rem 2rem', borderRadius: '12px', border: 'none', background: '#fff', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}>Subscribe Now</button>
                    </div>
                </div>
            </div>
        </main>
    );
}
