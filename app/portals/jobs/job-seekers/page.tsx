"use client";
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import createGlobe from 'cobe';
import { SectionHeader } from '@/components/ui';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import styles from './job-seekers.module.css';

// SVG Icons
const IconSparkle = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
    </svg>
);

const IconArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

const InteractiveGlobe = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef<number | null>(null);

    useEffect(() => {
        let phi = 0;
        let theta = 0.25;
        let width = 320; // default initial width

        if (!canvasRef.current) return;

        // Measure container size
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        if (container) {
            width = container.offsetWidth || 320;
        }

        const globe = createGlobe(canvas, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 0,
            theta: 0.25,
            dark: 0,
            diffuse: 1.2,
            mapSamples: 12000,
            mapBrightness: 6,
            baseColor: [0.95, 0.96, 0.98],
            markerColor: [0.23, 0.51, 0.96], // #3b82f6
            glowColor: [0.93, 0.96, 1.0],
            markers: [
                { location: [37.7749, -122.4194], size: 0.04, id: "sf" }, // San Francisco
                { location: [51.5074, -0.1278], size: 0.04, id: "london" },   // London
                { location: [35.6762, 139.6503], size: 0.04, id: "tokyo" },   // Tokyo
                { location: [12.9716, 77.5946], size: 0.05, id: "bangalore" },    // Bangalore
                { location: [-33.8688, 151.2093], size: 0.04, id: "sydney" }  // Sydney
            ]
        });

        // Set up manual animation loop
        let animationFrameId: number;
        const renderLoop = () => {
            if (pointerInteracting.current === null) {
                phi += 0.005;
            }
            globe.update({ phi, theta });
            animationFrameId = requestAnimationFrame(renderLoop);
        };
        renderLoop();

        // Resize handler to update WebGL canvas internal width/height
        const handleResize = () => {
            if (canvas && container) {
                const newWidth = container.offsetWidth;
                if (newWidth && newWidth !== width) {
                    width = newWidth;
                    globe.update({
                        width: width * 2,
                        height: width * 2
                    });
                }
            }
        };

        window.addEventListener('resize', handleResize);

        const handlePointerDown = (e: PointerEvent) => {
            pointerInteracting.current = e.clientX;
            if (canvas) canvas.style.cursor = 'grabbing';
        };

        const handlePointerUp = () => {
            pointerInteracting.current = null;
            if (canvas) canvas.style.cursor = 'grab';
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (pointerInteracting.current !== null) {
                const delta = e.clientX - pointerInteracting.current;
                pointerInteracting.current = e.clientX;
                phi += delta / 150;
            }
        };

        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointerup', handlePointerUp);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerout', handlePointerUp);

        return () => {
            globe.destroy();
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointerup', handlePointerUp);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('pointerout', handlePointerUp);
        };
    }, []);

    return (
        <div className={styles.globeContainer}>
            <canvas
                ref={canvasRef}
                className={styles.globeCanvas}
            />
        </div>
    );
};

const IconCheckCircle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const IconTrendingUp = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const IconSearch = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const IconMoney = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
    </svg>
);

const IconFile = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const IconMic = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
);


export default function JobSeekersPage() {
    return (
        <main className={styles.page}>
            {/* 1. Hero */}
            <section className={styles.hero}>
                <div className={styles.heroLayout}>
                    <div className={styles.heroContent}>
                        <div className={styles.aiBadge}>
                            <IconSparkle /> Jobs • Careers • Hiring
                        </div>
                        <h1 className={styles.heroTitle}>Find Work That <span className={styles.heroHighlight}>Moves You Forward</span></h1>
                        <p className={styles.heroDesc}>
                            Discover verified jobs, connect with leading employers, and build a career that grows with your skills, ambitions, and potential.
                        </p>
                        <Link href="/signup" className={styles.primaryCta}>
                            Create Your Profile <IconArrowRight />
                        </Link>
                    </div>

                    <div className={styles.heroGraphic}>
                        <div className={styles.graphicCenter}>
                            <InteractiveGlobe />
                        </div>

                        {/* 
                        <div className={`${styles.floatBadge} ${styles.floatBadgeTop}`}>
                            <div className={`${styles.badgeIcon} ${styles.badgeIconGreen}`}>
                                <IconCheckCircle />
                            </div>
                            <div className={styles.badgeText}>
                                <span className={styles.badgeLabel}>Match Score</span>
                                <span className={styles.badgeValue}>98% Fit</span>
                            </div>
                        </div>

                        <div className={`${styles.floatBadge} ${styles.floatBadgeBottom}`}>
                            <div className={`${styles.badgeIcon} ${styles.badgeIconBlue}`}>
                                <IconTrendingUp />
                            </div>
                            <div className={styles.badgeText}>
                                <span className={styles.badgeLabel}>Market Value</span>
                                <span className={styles.badgeValue}>$120k - $140k</span>
                            </div>
                        </div>
                        */}
                    </div>
                </div>
            </section>

            {/* 2. Intelligent Tools Grid */}
            <section className={styles.featuresSection}>
                <div className={styles.featuresHeader}>
                    <SectionHeader
                        centered
                        light
                        title={
                            <>
                                Everything You Need{" "}
                                <span className={styles.highlightText}>To Grow Your Career</span>
                            </>
                        }
                        description="Discover jobs, optimize your profile, prepare for interviews, and access salary insights to grow your career with confidence."
                    />
                </div>

                <div className={styles.featuresGrid}>
                    {/* Card 1 — Job Discovery */}
                    <div className={styles.featureCard}>
                        <DottedGlowBackground 
                            color="rgba(255, 255, 255, 0.05)"
                            glowColor="rgba(59, 130, 246, 0.3)"
                            gap={16}
                            radius={1.5}
                            opacity={0.8}
                        />
                        <div className={styles.featureIcon}><IconSearch /></div>
                        <h3 className={styles.featureTitle}>Job Discovery</h3>
                        <p className={styles.featureDesc}>
                            Explore relevant job opportunities based on your skills, experience, and career goals. Discover roles across industries and connect with employers actively hiring talent.
                        </p>
                        <div className={styles.cardFooter}>
                            <div className={styles.pillGroup}>
                                <span className={styles.featurePill}>Verified Jobs</span>
                                <span className={styles.featurePill}>Career Opportunities</span>
                                <span className={styles.featurePill}>Hiring Companies</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2 — Salary Insights */}
                    <div className={styles.featureCard}>
                        <DottedGlowBackground 
                            color="rgba(255, 255, 255, 0.05)"
                            glowColor="rgba(59, 130, 246, 0.3)"
                            gap={16}
                            radius={1.5}
                            opacity={0.8}
                        />
                        <div className={styles.featureIcon}><IconMoney /></div>
                        <h3 className={styles.featureTitle}>Salary Insights</h3>
                        <p className={styles.featureDesc}>
                            Research salary benchmarks, compensation trends, and market expectations to make informed career decisions and negotiate confidently.
                        </p>
                        <div className={styles.cardFooter}>
                            <div className={styles.pillGroup}>
                                <span className={styles.featurePill}>Salary Benchmarks</span>
                                <span className={styles.featurePill}>Market Trends</span>
                                <span className={styles.featurePill}>Compensation Data</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3 — Professional Profile */}
                    <div className={styles.featureCard}>
                        <DottedGlowBackground 
                            color="rgba(255, 255, 255, 0.05)"
                            glowColor="rgba(59, 130, 246, 0.3)"
                            gap={16}
                            radius={1.5}
                            opacity={0.8}
                        />
                        <div className={styles.featureIcon}><IconFile /></div>
                        <h3 className={styles.featureTitle}>Professional Profile</h3>
                        <p className={styles.featureDesc}>
                            Build a complete professional profile that showcases your skills, experience, achievements, and career aspirations to potential employers.
                        </p>
                        <div className={styles.cardFooter}>
                            <div className={styles.pillGroup}>
                                <span className={styles.featurePill}>Skills Showcase</span>
                                <span className={styles.featurePill}>Work Experience</span>
                                <span className={styles.featurePill}>Professional Branding</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4 — Interview Preparation */}
                    <div className={styles.featureCard}>
                        <DottedGlowBackground 
                            color="rgba(255, 255, 255, 0.05)"
                            glowColor="rgba(59, 130, 246, 0.3)"
                            gap={16}
                            radius={1.5}
                            opacity={0.8}
                        />
                        <div className={styles.featureIcon}><IconMic /></div>
                        <h3 className={styles.featureTitle}>Interview Preparation</h3>
                        <p className={styles.featureDesc}>
                            Access interview resources, career guidance, and practical preparation materials to improve confidence and performance during hiring processes.
                        </p>
                        <div className={styles.cardFooter}>
                            <div className={styles.pillGroup}>
                                <span className={styles.featurePill}>Interview Tips</span>
                                <span className={styles.featurePill}>Career Resources</span>
                                <span className={styles.featurePill}>Hiring Preparation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Bottom CTA */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaCard}>
                    <h2 className={styles.ctaTitle}>Ready to Elevate Your Career?</h2>
                    <p className={styles.ctaDesc}>
                        Join thousands of professionals who have accelerated their career growth with TalentMesh. Setup takes less than 5 minutes.
                    </p>
                    <Link href="/signup" className={styles.ctaBtn}>
                        Create Your Profile
                    </Link>
                </div>
            </section>
        </main>
    );
}
