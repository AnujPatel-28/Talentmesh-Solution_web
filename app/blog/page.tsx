"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './blog.module.css';

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

const FEATURED_POST = {
    title: "The State of AI Recruitment in 2026",
    description: "A deep-dive into how machine learning is fundamentally changing the speed, accuracy, and fairness of hiring across every industry sector.",
    category: "Technology",
    date: "Feb 22, 2026",
    emoji: "🤖",
    link: "/blog/state-of-ai-2026",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e40af 100%)",
};

const BLOG_POSTS = [
    {
        title: "The Future of AI in Recruitment",
        description: "How machine learning is changing the way we find and vet top engineering talent in 2026.",
        category: "Technology",
        date: "Feb 15, 2026",
        link: "/blog/future-of-ai",
        emoji: "🧠",
        gradient: "linear-gradient(135deg, #1e3a5f, #007BFF)",
    },
    {
        title: "Navigating Remote Work Culture",
        description: "Best practices for maintaining team cohesion and productivity in a distributed environment.",
        category: "Culture",
        date: "Feb 10, 2026",
        link: "/blog/remote-culture",
        emoji: "🏠",
        gradient: "linear-gradient(135deg, #064e3b, #10b981)",
    },
    {
        title: "Mastering the Technical Interview",
        description: "A comprehensive guide for candidates to excel in high-stakes engineering interviews.",
        category: "Career Advice",
        date: "Feb 05, 2026",
        link: "/blog/technical-interview",
        emoji: "💻",
        gradient: "linear-gradient(135deg, #4c1d95, #8b5cf6)",
    },
    {
        title: "Building a Bias-Free Hiring Process",
        description: "Practical strategies for structuring interviews and evaluations that remove unconscious bias.",
        category: "Engineering",
        date: "Jan 30, 2026",
        link: "/blog/bias-free-hiring",
        emoji: "⚖️",
        gradient: "linear-gradient(135deg, #7f1d1d, #ef4444)",
    },
    {
        title: "Engineering Team Culture at Scale",
        description: "How leading tech companies maintain strong culture as headcount grows from 50 to 5,000.",
        category: "Culture",
        date: "Jan 22, 2026",
        link: "/blog/engineering-culture",
        emoji: "🏗️",
        gradient: "linear-gradient(135deg, #78350f, #f59e0b)",
    },
    {
        title: "Salary Trends in Tech for 2026",
        description: "Data-backed analysis of compensation trends across engineering, product, and design roles.",
        category: "Product",
        date: "Jan 15, 2026",
        link: "/blog/salary-trends-2026",
        emoji: "📈",
        gradient: "linear-gradient(135deg, #0c4a6e, #06b6d4)",
    },
];

const CATEGORIES = ["All", "Technology", "Culture", "Career Advice", "Engineering", "Product"];

export default function BlogPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");

    const filtered = BLOG_POSTS.filter(p => {
        const matchesCat = activeCategory === "All" || p.category === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

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
            <section className={styles.featuredSection}>
                <div className="premium-container">
                    <div className={styles.featuredCard}>
                        <div className={styles.featuredBanner} style={{ background: FEATURED_POST.gradient }}>
                            <div className={styles.cardBannerEmoji}>{FEATURED_POST.emoji}</div>
                        </div>
                        <div className={styles.featuredBody}>
                            <span className={styles.featuredCategory}>⭐ Featured • {FEATURED_POST.category}</span>
                            <div className={styles.featuredDate}>{FEATURED_POST.date}</div>
                            <h2 className={styles.featuredTitle}>{FEATURED_POST.title}</h2>
                            <p className={styles.featuredDesc}>{FEATURED_POST.description}</p>
                            <Link href={FEATURED_POST.link} className={styles.readMoreBtn}>
                                Read Article <IconArrowRight />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Articles Grid */}
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

                    {filtered.length > 0 ? (
                        <div className={styles.articlesGrid}>
                            {filtered.map((post, i) => (
                                <div key={i} className={styles.articleCard}>
                                    <div className={styles.cardBanner} style={{ background: post.gradient }}>
                                        <div className={styles.cardBannerEmoji}>{post.emoji}</div>
                                        <span className={styles.catTag}>{post.category}</span>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardDate}>{post.date}</div>
                                        <h3 className={styles.cardTitle}>{post.title}</h3>
                                        <p className={styles.cardDesc}>{post.description}</p>
                                        <Link href={post.link} className={styles.readLink}>
                                            Read Article <IconArrowRight />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--medium-grey)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <p style={{ fontSize: '1.1rem' }}>No articles found. Try a different search or category.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Newsletter */}
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
        </main>
    );
}
