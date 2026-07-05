"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './blog.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { publicInsforge } from '@/lib/insforge';
import HeroBg from '@/components/ui/HeroBg/HeroBg';
import { SectionHeader, CTA, LoadingScreen } from '@/components/ui';
import { Headphones, Play } from 'lucide-react';

const IconArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

const CATEGORIES = ["All", "Technology", "Career Advice", "AI & Recruitment", "Success Stories", "Product Updates", "Culture"];

const MOCK_FEATURED_FALLBACK = {
    id: "mock-featured-2",
    title: "Scaling Engineering Teams: AI-Driven Hiring in 2026",
    slug: "scaling-engineering-teams-ai-driven-hiring-2026",
    excerpt: "Discover how top-tier organizations are leveraging AI screening models to reduce time-to-hire by 60% while improving candidate diversity and technical matching accuracy.",
    category: "AI & Recruitment",
    cover_image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&h=500&q=80",
    created_at: new Date().toISOString()
};

const HUBS = [
    {
        name: "San Francisco Hub",
        address: "100 Pine St, San Francisco, CA 94111",
        image: "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=300&h=200&q=80"
    },
    {
        name: "London Hub",
        address: "30 St Mary Axe, London EC3A 8EP, UK",
        image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=300&h=200&q=80"
    },
    {
        name: "Bangalore Hub",
        address: "80 Feet Rd, Koramangala, Bangalore 560034",
        image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=300&h=200&q=80"
    }
];

export default function BlogPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.title = "Our News & Blogs | TalentMesh Solutions";
        }
        async function fetchPosts() {
            try {
                const { data, error } = await publicInsforge.database
                    .from('blog')
                    .select('id, title, slug, excerpt, content, category, cover_image, status, created_at, author_id')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });
                if (error) {
                    throw new Error((error as any).message || 'Failed to fetch posts');
                }
                setPosts(data || []);
            } catch (err: any) {
                console.error('Fetch posts error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
            setEmail("");
            setTimeout(() => setSubscribed(false), 5000);
        }
    };

    const filtered = posts.filter(p => {
        const matchesCat = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.excerpt?.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    // Make sure we have 2 featured posts (real or fallback) for the side-by-side design
    const featuredPosts: any[] = [];
    if (filtered.length > 0) {
        featuredPosts.push(filtered[0]);
    }
    if (filtered.length > 1) {
        featuredPosts.push(filtered[1]);
    } else if (filtered.length === 1) {
        featuredPosts.push(MOCK_FEATURED_FALLBACK);
    }

    // Remaining posts for the main list section
    const latestPosts = filtered.length > 2 ? filtered.slice(2) : filtered;

    const getCategoryCount = (categoryName: string) => {
        if (categoryName === "All") return posts.length;
        return posts.filter(p => p.category === categoryName).length;
    };

    if (loading) return <LoadingScreen />;

    return (
        <main className={styles.blogWrapper}>
            <HeroBg src="/bg2.png" fixed />
            
            {/* 1. Header Hero */}
            <section className={styles.heroSection}>
                <div className="premium-container">
                    <div className={styles.heroInner}>
                        <SectionHeader
                            centered
                            tag="TalentMesh Insights"
                            title={<>Our <span className={styles.highlight}>News &amp; Blogs.</span></>}
                            description="The latest perspectives on AI, recruitment tech, hiring strategies, and the future of engineering talent."
                        />
                        <div className={styles.searchBar}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className={styles.clearSearchBtn}>Clear</button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Side-by-Side Featured Cards */}
            {featuredPosts.length > 0 && (
                <section className={styles.featuredGridSection}>
                    <div className="premium-container">
                        <div className={styles.featuredGrid}>
                            {featuredPosts.map((post, index) => (
                                <AnimateOnScroll key={post.id || index} animation="fadeUp" delay={index * 150}>
                                    <div className={`${styles.featuredCard} glass-card`}>
                                        <div className={styles.cardImageWrapper}>
                                            <Image
                                                src={post.cover_image || "/images/tech-office.jpg"}
                                                alt={post.title}
                                                fill
                                                className={styles.postImg}
                                                unoptimized={post.cover_image?.startsWith('http')}
                                            />
                                            <Link href={`/blog/${post.slug}`} className={styles.arrowCircle} aria-label={`Read ${post.title}`}>
                                                <IconArrowRight />
                                            </Link>
                                        </div>
                                        <div className={styles.featuredCardContent}>
                                            <span className={styles.categoryTag}>{post.category}</span>
                                            <h3 className={styles.featuredTitle}>
                                                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                                            </h3>
                                            <p className={styles.featuredExcerpt}>{post.excerpt}</p>
                                            <div className={styles.cardFooter}>
                                                <span suppressHydrationWarning>{new Date(post.created_at).toLocaleDateString()}</span>
                                                <span className={styles.dotSeparator}>•</span>
                                                <span>5 min read</span>
                                            </div>
                                        </div>
                                    </div>
                                </AnimateOnScroll>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 3. Middle Editorial Divider */}
            <section className={styles.editorialDivider}>
                <div className="premium-container">
                    <div className={styles.dividerInner}>
                        <span className={styles.editorialLabel}>Blog goal</span>
                        <p className={styles.editorialText}>
                            The everyday news you need from the talent acquisition market. Updated stats, datas, and information from the recruitment ecosystem.
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. Two-Column Main Layout: Sidebar vs Latest + Newsletter */}
            <section className={styles.mainLayoutSection}>
                <div className="premium-container">
                    <div className={styles.layoutContainer}>
                        
                        {/* LEFT COLUMN: Sidebar (Category list and office hubs) */}
                        <aside className={styles.sidebarColumn}>
                            
                            {/* Categories Filter list with counts */}
                            <div className={`${styles.categoriesBox} glass-card`}>
                                <h3 className={styles.sidebarHeading}>Browse Categories</h3>
                                <ul className={styles.categoriesList}>
                                    {CATEGORIES.map(cat => {
                                        const count = getCategoryCount(cat);
                                        return (
                                            <li key={cat}>
                                                <button
                                                    onClick={() => setActiveCategory(cat)}
                                                    className={`${styles.categoryItemBtn} ${activeCategory === cat ? styles.categoryActive : ''}`}
                                                >
                                                    <span className={styles.categoryName}>{cat}</span>
                                                    <span className={styles.categoryCount}>({count})</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            {/* Come to Visit Us (Office Hubs) */}
                            <div className={styles.hubsBox}>
                                <h3 className={styles.sidebarHeading}>Come to visit us</h3>
                                <div className={styles.hubsList}>
                                    {HUBS.map((hub, idx) => (
                                        <div key={idx} className={`${styles.hubCard} glass-card`}>
                                            <div className={styles.hubImageWrapper}>
                                                <Image
                                                    src={hub.image}
                                                    alt={hub.name}
                                                    fill
                                                    className={styles.hubImg}
                                                    unoptimized
                                                />
                                                <div className={styles.hubArrow}>
                                                    <IconArrowRight />
                                                </div>
                                            </div>
                                            <div className={styles.hubContent}>
                                                <h4 className={styles.hubName}>{hub.name}</h4>
                                                <p className={styles.hubAddress}>{hub.address}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* RIGHT COLUMN: Latest Articles & Newsletter */}
                        <div className={styles.mainContentColumn}>
                            
                            <div className={styles.sectionHeaderRow}>
                                <h2 className={styles.sectionTitle}>Latest Articles</h2>
                                {activeCategory !== "All" && (
                                    <span className={styles.activeFilterBadge}>Category: {activeCategory}</span>
                                )}
                            </div>

                            {latestPosts.length > 0 ? (
                                <div className={styles.latestGrid}>
                                    {latestPosts.map((post, idx) => (
                                        <div key={post.id || idx} className={`${styles.latestCard} glass-card`}>
                                            <div className={styles.latestImageWrapper}>
                                                <Image
                                                    src={post.cover_image || "/images/tech-office.jpg"}
                                                    alt={post.title}
                                                    fill
                                                    className={styles.postImg}
                                                    unoptimized={post.cover_image?.startsWith('http')}
                                                />
                                            </div>
                                            <div className={styles.latestContent}>
                                                <span className={styles.latestCategory}>{post.category}</span>
                                                <h3 className={styles.latestTitle}>
                                                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                                                </h3>
                                                <p className={styles.latestExcerpt}>{post.excerpt}</p>
                                                <div className={styles.cardFooter}>
                                                    <span suppressHydrationWarning>{new Date(post.created_at).toLocaleDateString()}</span>
                                                    <span className={styles.dotSeparator}>•</span>
                                                    <span>{post.read_time || '4 min read'}</span>
                                                </div>
                                                <Link href={`/blog/${post.slug}`} className={styles.readMoreLink}>
                                                    Read Article <IconArrowRight />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`${styles.emptyState} glass-card`}>
                                    <div className={styles.emptyIcon}>🔍</div>
                                    <h3>No articles found</h3>
                                    <p>Try searching for another keyword or picking a different category filter.</p>
                                </div>
                            )}

                            {/* Newsletter Subscription Box inside the content column */}
                            <div className={`${styles.newsletterBox} glass-card`}>
                                <div className={styles.newsletterContent}>
                                    <h3 className={styles.newsletterTitle}>Join the newsletter</h3>
                                    <p className={styles.newsletterDesc}>All the latest recruiting insights and market developments from TalentMesh.</p>
                                    {subscribed ? (
                                        <div className={styles.subscribeSuccess}>
                                            ✓ Thank you! You&apos;ve subscribed to our newsletter successfully.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
                                            <input
                                                type="email"
                                                required
                                                placeholder="Your email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className={styles.newsletterInput}
                                            />
                                            <button type="submit" className={styles.newsletterBtn}>Subscribe</button>
                                        </form>
                                    )}
                                </div>
                            </div>

                            {/* Featured Podcast Episode Card */}
                            <div className={`${styles.podcastCard} glass-card`}>
                                <div className={styles.podcastImageWrapper}>
                                    <Image
                                        src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&h=250&q=80"
                                        alt="TalentMesh Podcast"
                                        fill
                                        className={styles.podcastImg}
                                        unoptimized
                                    />
                                </div>
                                <div className={styles.podcastHeader}>
                                    <span className={styles.podcastBadge}>Podcast</span>
                                    <span className={styles.podcastEpisodeNum}>EP. 48</span>
                                </div>
                                <h3 className={styles.podcastTitle}>
                                    <Link href="/portals/jobs/podcast">The End of the Job Description — With Sarah Chen, CPO at Figma</Link>
                                </h3>
                                <p className={styles.podcastDesc}>
                                    How leading companies are replacing rigid job descriptions with dynamic skill matrices — and why it&apos;s closing the gap on hiring speed by over 60%.
                                </p>
                                <div className={styles.podcastFooter}>
                                    <div className={styles.podcastMeta}>
                                        <div className={styles.podcastMetaItem}>
                                            <Headphones size={14} />
                                            <span>52 min</span>
                                        </div>
                                        <span className={styles.dotSeparator}>•</span>
                                        <span>Feb 22, 2026</span>
                                    </div>
                                    <Link href="/portals/jobs/podcast" className={styles.podcastPlayBtn}>
                                        <Play size={12} fill="currentColor" /> Listen Now
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 5. Glowing Transparent CTA Section */}
            <CTA
                title={<>Ready to Find Your Next <span className={styles.highlightText}>Dream Role?</span></>}
                description="Explore job openings tailored to your specific engineering expertise. Let's create the recruitment ecosystem of the future."
                buttonText="Explore Open Roles"
                buttonLink="/portals/jobs/careers"
            />
        </main>
    );
}
