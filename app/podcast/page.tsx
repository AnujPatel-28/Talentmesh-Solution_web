"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './podcast.module.css';

const IconSparkle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915L12 3Z" />
    </svg>
);
const IconPlay = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);
const IconPause = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
    </svg>
);
const IconArrowRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

const PLATFORMS = [
    { name: 'Spotify', emoji: '🎵', color: '#1DB954', href: '#' },
    { name: 'Apple Podcasts', emoji: '🎙️', color: '#9B59B6', href: '#' },
    { name: 'Google Podcasts', emoji: '🎧', color: '#EA4335', href: '#' },
    { name: 'YouTube', emoji: '▶️', color: '#FF0000', href: '#' },
];

const FEATURED_EPISODE = {
    number: 'EP. 48',
    title: 'The End of the Job Description — With Sarah Chen, CPO at Figma',
    desc: "How leading companies are replacing rigid job descriptions with dynamic skill matrices — and why it's closing the gap on hiring speed by over 60%.",
    duration: '52:14',
    date: 'Feb 22, 2026',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
    emoji: '🎙️',
};

const EPISODES = [
    {
        num: 'EP. 47',
        title: 'Why 85% of Elite Engineers are Passive Candidates',
        desc: 'The hidden talent pool no recruiter talks about — and how to reach them.',
        duration: '44:30',
        date: 'Feb 15, 2026',
        gradient: 'linear-gradient(135deg, #1e3a5f, #007BFF)',
        emoji: '🔍',
        guest: 'Marcus Webb, Head of Talent @ Stripe',
    },
    {
        num: 'EP. 46',
        title: 'Building Bias-Free Hiring at Scale',
        desc: 'Structural changes to the interview process that measurably reduce unconscious bias.',
        duration: '38:55',
        date: 'Feb 08, 2026',
        gradient: 'linear-gradient(135deg, #064e3b, #10b981)',
        emoji: '⚖️',
        guest: 'Dr. Amara Osei, Head of DEI @ Google',
    },
    {
        num: 'EP. 45',
        title: 'Salary Transparency: The Next Competitive Weapon',
        desc: 'How open comp bands are becoming a recruiting superpower for high-growth startups.',
        duration: '41:18',
        date: 'Feb 01, 2026',
        gradient: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
        emoji: '💰',
        guest: 'Priya Sharma, Compensation Lead @ Airbnb',
    },
    {
        num: 'EP. 44',
        title: 'The Rise of Fractional Engineering Teams',
        desc: 'A deep dive into the new model of on-demand senior talent for pre-Series A startups.',
        duration: '35:42',
        date: 'Jan 25, 2026',
        gradient: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
        emoji: '🔧',
        guest: 'James Okafor, CTO @ ScaleUp',
    },
    {
        num: 'EP. 43',
        title: "AI Won't Replace Recruiters — Here's Why",
        desc: 'The evolving role of human judgment in an AI-first hiring workflow.',
        duration: '49:02',
        date: 'Jan 18, 2026',
        gradient: 'linear-gradient(135deg, #0c4a6e, #06b6d4)',
        emoji: '🤝',
        guest: 'Sofia Chen, CTO @ TalentMesh',
    },
    {
        num: 'EP. 42',
        title: 'Global Hiring in a Post-Remote World',
        desc: 'The legal, cultural, and operational realities of building distributed world-class teams.',
        duration: '46:30',
        date: 'Jan 11, 2026',
        gradient: 'linear-gradient(135deg, #78350f, #f59e0b)',
        emoji: '🌍',
        guest: 'Kenji Watanabe, VP People @ Notion',
    },
];

const CATEGORIES = ["All Episodes", "Hiring Strategy", "AI & Tech", "Compensation", "Culture & DEI"];

export default function PodcastPage() {
    const [activeCategory, setActiveCategory] = useState("All Episodes");
    const [playing, setPlaying] = useState<number | null>(null);

    return (
        <main className={styles.page}>
            {/* 1. Hero */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>
                            <IconSparkle /> New Episode Every Week • 28K Listeners
                        </div>
                        <h1 className={styles.heroTitle}>
                            The TalentMesh<br />
                            <span className={styles.heroHighlight}>Podcast.</span>
                        </h1>
                        <p className={styles.heroDesc}>
                            Unfiltered conversations with the world's top hiring leaders, founders,
                            and engineers on the future of talent, tech, and work.
                        </p>
                        <div className={styles.platforms}>
                            {PLATFORMS.map((p, i) => (
                                <a key={i} href={p.href} className={styles.platformPill} target="_blank" rel="noopener noreferrer">
                                    <span>{p.emoji}</span>
                                    <span>{p.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Featured Episode */}
            <section className={styles.featuredSection}>
                <div className="premium-container">
                    <span className={styles.sectionTagLight}>Latest Episode</span>
                    <div className={styles.featuredCard}>
                        <div className={styles.featuredVisual} style={{ background: FEATURED_EPISODE.gradient }}>
                            <div className={styles.featuredEmoji}>{FEATURED_EPISODE.emoji}</div>
                            <div className={styles.featuredWave}>
                                {Array.from({ length: 14 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={styles.waveBar}
                                        style={{
                                            height: `${18 + Math.abs(Math.sin(i * 0.85)) * 30}px`,
                                            animationDelay: `${i * 0.1}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className={styles.featuredBody}>
                            <span className={styles.epNum}>{FEATURED_EPISODE.number}</span>
                            <div className={styles.epMeta}>
                                <span>{FEATURED_EPISODE.date}</span>
                                <span className={styles.dot}>·</span>
                                <span>⏱ {FEATURED_EPISODE.duration}</span>
                            </div>
                            <h2 className={styles.featuredTitle}>{FEATURED_EPISODE.title}</h2>
                            <p className={styles.featuredDesc}>{FEATURED_EPISODE.desc}</p>
                            <div className={styles.featuredActions}>
                                <button className={styles.playBtnLarge}>
                                    <IconPlay /> Play Episode
                                </button>
                                <Link href="#" className={styles.showNotesLink}>
                                    Show Notes <IconArrowRight />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Episodes Grid */}
            <section className={styles.episodesSection}>
                <div className="premium-container">
                    <div className={styles.episodesHeader}>
                        <h2 className={styles.episodesTitle}>All Episodes</h2>
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
                    </div>
                    <div className={styles.episodesGrid}>
                        {EPISODES.map((ep, i) => (
                            <div key={i} className={styles.episodeCard}>
                                <div className={styles.epCardVisual} style={{ background: ep.gradient }}>
                                    <span className={styles.epCardEmoji}>{ep.emoji}</span>
                                    <button
                                        className={`${styles.playBtn} ${playing === i ? styles.playing : ''}`}
                                        onClick={() => setPlaying(playing === i ? null : i)}
                                        aria-label={`Play ${ep.title}`}
                                    >
                                        {playing === i ? <IconPause /> : <IconPlay />}
                                    </button>
                                </div>
                                <div className={styles.epCardBody}>
                                    <div className={styles.epCardMeta}>
                                        <span className={styles.epNumSmall}>{ep.num}</span>
                                        <span className={styles.epDuration}>⏱ {ep.duration}</span>
                                    </div>
                                    <h3 className={styles.epCardTitle}>{ep.title}</h3>
                                    <p className={styles.epCardDesc}>{ep.desc}</p>
                                    <div className={styles.guestBadge}>🎙 {ep.guest}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Subscribe CTA */}
            <section className={styles.ctaSection}>
                <div className="premium-container">
                    <div className={styles.ctaCard}>
                        <div className={styles.ctaIcon}>🎧</div>
                        <h2 className={styles.ctaTitle}>Never miss an episode.</h2>
                        <p className={styles.ctaDesc}>
                            Subscribe on your favourite platform and get new episodes delivered every Tuesday.
                        </p>
                        <div className={styles.ctaPlatforms}>
                            {PLATFORMS.map((p, i) => (
                                <a key={i} href={p.href} className={styles.ctaPlatformBtn}
                                    style={{ background: p.color }} target="_blank" rel="noopener noreferrer">
                                    {p.emoji} {p.name}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
