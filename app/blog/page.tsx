"use client";
// UNIQUE_TAG: REAL_BLOG_PAGE_FIX_V1
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './blog.module.css';
import { insforge } from '@/lib/insforge';
import AnimateOnScroll from '@/components/AnimateOnScroll';

const IconSparkle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915L12 3Z" />
    </svg>
);
const IconArrowRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

const CATEGORIES = ["All", "Technology", "Culture", "Career Advice", "Engineering", "Product"];

export default function BlogPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchPosts() {
            try {
                const { data } = await insforge.database
                    .from('blog')
                    .select('*')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });
                setPosts(data || []);
            } catch (err) {
                console.error('Fetch posts error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);

    const filtered = posts.filter(p => {
        const matchesCat = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.excerpt?.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const featuredPost = filtered[0];
    const displayPosts = filtered.slice(1);

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTopColor: '#007BFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <main style={{ background: '#fff' }}>
            {/* 1. Hero */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>
                            <IconSparkle /> Updated Daily • 12.4k Readers
                        </div>
                        <h1 className={styles.title}>
                            Insights &{' '}
                            <span className={styles.highlight}>perspectives.</span>
                        </h1>
                        <p className={styles.description}>
                            The latest thinking on AI, hiring, and the future of work — from the TalentMesh team and industry leaders.
                        </p>
                        <div className={styles.searchBar}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button className={styles.searchBtn}>Search</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Featured Post */}
            {featuredPost && (
                <AnimateOnScroll animation="fadeUp">
                    <section className={styles.featuredSection}>
                        <div className="premium-container">
                            <div className={styles.featuredCard}>
                                <div className={styles.featuredBanner}>
                                    <Image
                                        src={featuredPost.cover_image || "/images/tech-office.jpg"}
                                        alt={featuredPost.title}
                                        fill
                                        className={styles.featuredImg}
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <div className={styles.featuredBody}>
                                    <span className={styles.featuredCategory}>⭐ Featured • {featuredPost.category}</span>
                                    <div className={styles.featuredDate}>{new Date(featuredPost.created_at).toLocaleDateString()}</div>
                                    <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                                    <p className={styles.featuredDesc}>{featuredPost.excerpt}</p>
                                    <Link href={`/blog/${featuredPost.slug}`} className={styles.readMoreBtn}>
                                        Read Article <IconArrowRight />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </AnimateOnScroll>
            )}

            {/* 3. Articles Grid */}
            <AnimateOnScroll animation="fadeUp" delay={100}>
                <section className={styles.articlesSection}>
                    <div className="premium-container">
                        <div className={styles.categoryRow}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    className={`${styles.chip} ${activeCategory === cat ? styles.chipActive : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {displayPosts.length > 0 ? (
                            <div className={styles.articlesGrid}>
                                {displayPosts.map((post, i) => (
                                    <div key={post.id} className={styles.articleCard}>
                                        <div className={styles.cardBanner}>
                                            <Image
                                                src={post.cover_image || "/images/tech-office.jpg"}
                                                alt={post.title}
                                                fill
                                                className={styles.cardImg}
                                                style={{ objectFit: 'cover' }}
                                            />
                                            <span className={styles.catTag}>{post.category}</span>
                                        </div>
                                        <div className={styles.cardBody}>
                                            <div className={styles.cardDate}>{new Date(post.created_at).toLocaleDateString()}</div>
                                            <h3 className={styles.cardTitle}>{post.title}</h3>
                                            <p className={styles.cardDesc}>{post.excerpt}</p>
                                            <Link href={`/blog/${post.slug}`} className={styles.readLink}>
                                                Read Article <IconArrowRight />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !featuredPost && (
                            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--medium-grey)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                                <p style={{ fontSize: '1.1rem' }}>No articles found. Try a different search or category.</p>
                            </div>
                        )}
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 4. Newsletter */}
            <AnimateOnScroll animation="scaleUp">
                <section className={styles.newsletterSection}>
                    <div className="premium-container">
                        <div className={styles.newsletterCard}>
                            <h2>Never miss an update.</h2>
                            <p>
                                Get the latest insights on AI recruitment and talent strategy delivered straight to your inbox every week.
                            </p>
                            <div className={styles.emailForm}>
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    className={styles.emailInput}
                                />
                                <button className={styles.subscribeBtn}>Subscribe</button>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>
        </main>
    );
}
