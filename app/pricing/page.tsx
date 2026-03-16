"use client";
import React from 'react';
import Link from 'next/link';
import styles from './pricing.module.css';
import AnimateOnScroll from '@/components/AnimateOnScroll';

// --- Premium Custom Icons ---
const IconCheck = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconShield = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconGlobe = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20" />
    </svg>
);

const IconZap = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const IconSparkle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915L12 3Z" />
    </svg>
);

const PARTNERS = ["Neural Networks", "Quantum Systems", "Fintech Infrastructure", "Distributed Ledger", "Autonomous Robotics", "Cloud Native", "Edge Computing", "Cyber Defense"];

const PLANS = [
    {
        name: "Core Sourcing",
        price: "499",
        desc: "Essential AI-driven sourcing for early stage startups and small teams.",
        features: [
            "5 Active Job Protocols",
            "Aura AI Sourcing Engine",
            "Basic Skill Vetting",
            "Email Support",
            "Candidate CRM",
            "Core Analytics"
        ],
        button: "Start Core",
        primary: false
    },
    {
        name: "Growth Stack",
        price: "1,299",
        desc: "Automated technical vetting for rapidly scaling engineering organizations.",
        features: [
            "Unlimited Job Protocols",
            "Priority AI Slots",
            "Biometric Skill Verification",
            "24/7 Dedicated Support",
            "ATS Sync Integration",
            "Advanced Market IQ"
        ],
        button: "Get Early Access",
        primary: true,
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        desc: "Bespoke talent acquisition strategies for global technology ecosystems.",
        features: [
            "White-glove Stealth Sourcing",
            "Custom ML Model Training",
            "Full Security Compliance",
            "Executive Search Portal",
            "Unlimited Multi-user",
            "SLA & Priority Access"
        ],
        button: "Schedule a Consult",
        primary: false
    }
];

// HMR Trigger: Refreshing module tree...
export default function PricingPage() {
    return (
        <main style={{ background: '#fff' }}>
            {/* 1. Hero Section */}
            <section className={styles.hero}>
                <div className="premium-container">
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>
                            <IconSparkle /> Transparent • Enterprise Ready • Secure
                        </div>
                        <h1 className={styles.title}>
                            Investment in <br />
                            <span className={styles.highlight}>excellence.</span>
                        </h1>
                        <p className={styles.description}>
                            Flexible protocols designed for high-growth innovation hubs and
                            global technical ecosystems alike.
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. Specialized Marquee */}
            <div className={styles.marqueeContainer}>
                <div className={styles.marqueeTrack}>
                    {[...PARTNERS, ...PARTNERS].map((p, i) => (
                        <span key={i} className={styles.partnerName}>{p}</span>
                    ))}
                </div>
            </div>

            {/* 3. Pricing Grid */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.pricingSection}>
                    <div className="premium-container">
                        <div className={styles.pricingGrid}>
                            {PLANS.map((plan, i) => (
                                <div key={i} className={styles.pricingCard}>
                                    {plan.popular && <div className={styles.popularBadge}>Most Precision</div>}
                                    <h3 className={styles.planName}>{plan.name}</h3>
                                    <div className={styles.planPrice}>
                                        {plan.price !== "Custom" && <span className={styles.currency}>$</span>}
                                        <span className={styles.amount}>{plan.price}</span>
                                        {plan.price !== "Custom" && <span className={styles.period}>/mo</span>}
                                    </div>
                                    <p className={styles.planDesc}>{plan.desc}</p>

                                    <ul className={styles.featureList}>
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className={styles.featureItem}>
                                                <div className={styles.checkIcon}><IconCheck /></div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href="/register"
                                        className={`${styles.planBtn} ${plan.primary ? styles.primaryBtn : ''}`}
                                    >
                                        {plan.button}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 4. Enterprise Grade Details */}
            <AnimateOnScroll animation="blurIn">
                <section className={styles.infraSection}>
                    <div className="premium-container">
                        <div className={styles.infraHeader}>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>Diagnostic Infrastructure</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.25rem' }}>Security, compliance, and support at scale.</p>
                        </div>

                        <div className={styles.infraGrid}>
                            <div className={styles.infraCard}>
                                <div className={styles.infraIcon}><IconShield /></div>
                                <h3 className={styles.infraTitle}>SSO & Auth 2.0</h3>
                                <p className={styles.infraText}>Integrated with Okta, Azure AD, and Google Workspace for seamless enterprise access management.</p>
                            </div>
                            <div className={styles.infraCard}>
                                <div className={styles.infraIcon}><IconGlobe /></div>
                                <h3 className={styles.infraTitle}>Data Sovereignty</h3>
                                <p className={styles.infraText}>Select your primary hosting region to comply with global GDPR, CCPA, and regional data residency laws.</p>
                            </div>
                            <div className={styles.infraCard}>
                                <div className={styles.infraIcon}><IconZap /></div>
                                <h3 className={styles.infraTitle}>Dedicated Deployment</h3>
                                <p className={styles.infraText}>Guaranteed 99.99% system uptime with a dedicated deployment success lead for your team.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 5. FAQ Section */}
            <AnimateOnScroll animation="fadeUp" delay={100}>
                <section className={styles.faqSection}>
                    <div className="premium-container">
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--deep-navy)' }}>Frequently Asked Questions</h2>
                        </div>

                        <div className={styles.faqGrid}>
                            <div className={styles.faqItem}>
                                <h4 className={styles.faqQuestion}>How does the AI sourcing work?</h4>
                                <p className={styles.faqAnswer}>Our engine scans millions of open-source signals, project contributions, and technical deployments to identify specialists before they are active in the market.</p>
                            </div>
                            <div className={styles.faqItem}>
                                <h4 className={styles.faqQuestion}>Can I cancel my subscription?</h4>
                                <p className={styles.faqAnswer}>Yes, you can upgrade or discontinue your protocol at any time. We also offer month-to-month deployment options for specific hiring sprints.</p>
                            </div>
                            <div className={styles.faqItem}>
                                <h4 className={styles.faqQuestion}>Do you offer volume discounts?</h4>
                                <p className={styles.faqAnswer}>Our Enterprise ecosystems can scale to thousands of hires annually. Contact our solutions team for custom volume pricing and platform white-labeling.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 6. Custom CTA */}
            <AnimateOnScroll animation="scaleUp">
                <section style={{ padding: '10rem 0' }}>
                    <div className="premium-container">
                        <div style={{ background: 'var(--gradient-primary)', borderRadius: '48px', padding: '10rem 4rem', textAlign: 'center', color: 'white' }}>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem' }}>Ready to deploy?</h2>
                            <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem' }}>
                                Join the world's leading Enterprise Ecosystems and start sourcing elite technical talent today.
                            </p>
                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link href="/register" style={{ background: 'white', color: 'var(--primary-blue)', padding: '1.5rem 4rem', borderRadius: '18px', fontWeight: 900, fontSize: '1.1rem' }}>Start Now</Link>
                                <Link href="/contact" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '1.5rem 4rem', borderRadius: '18px', fontWeight: 900, fontSize: '1.1rem', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>Talk to Sales</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>
        </main>
    );
}
