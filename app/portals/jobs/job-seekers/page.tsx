"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import createGlobe from 'cobe';
import { SectionHeader } from '@/components/ui';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { CTA } from '@/components/sections';
import styles from './job-seekers.module.css';
import {
    Clock,
    Sparkles,
    Heart,
    Smile,
    Compass,
    Check,
    ArrowRight,
    Calculator,
    Award,
    Users,
    Shield,
    Download,
    UserCheck,
    GraduationCap,
    TrendingUp,
    Briefcase,
    Coins
} from 'lucide-react';

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

// Deterministic Indian Rupees formatter to prevent Next.js SSR hydration mismatches
function formatIndianRupees(num: number): string {
    const x = num.toString();
    const lastThree = x.slice(-3);
    const otherNumbers = x.slice(0, -3);
    if (otherNumbers !== '') {
        const remaining = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
        return remaining + ',' + lastThree;
    }
    return lastThree;
}

export default function JobSeekersPage() {
    // ─── 1. Total Rewards Visualizer States (Values scaled to Indian Rupees ₹) ───
    const [baseSalary, setBaseSalary] = useState(1500000); // 15 Lakhs default
    const [healthSelected, setHealthSelected] = useState(true);
    const [retirementSelected, setRetirementSelected] = useState(true);
    const [wellnessSelected, setWellnessSelected] = useState(true);
    const [learningSelected, setLearningSelected] = useState(true);
    const [hsaSelected, setHsaSelected] = useState(true);

    const healthVal = healthSelected ? 150000 : 0; // ₹1,50,000/yr
    const retirementVal = retirementSelected ? Math.round(baseSalary * 0.04) : 0; // 4% PF Match
    const wellnessVal = wellnessSelected ? 50000 : 0; // ₹50,000/yr
    const learningVal = learningSelected ? 150000 : 0; // ₹1,50,000/yr
    const hsaVal = hsaSelected ? 50000 : 0; // ₹50,000/yr (Tax-advantaged pension match)

    const benefitsTotal = healthVal + retirementVal + wellnessVal + learningVal + hsaVal;
    const totalCompensation = baseSalary + benefitsTotal;

    const baseRatio = Math.round((baseSalary / totalCompensation) * 100);
    const benefitsRatio = 100 - baseRatio;

    // ─── 2. Wellbeing & Flexibility Expandable Cards ───
    const [activeWellbeing, setActiveWellbeing] = useState<number | null>(null);

    const WELLBEING_CARDS = [
        {
            title: "Flexible Working Models",
            stat: "90% use flexible hours",
            desc: "Work asynchronously with flexible scheduling and remote-first policies.",
            longDesc: "Work from anywhere in the world. We offer asynchronous-first communication channels and core collaboration hours from 10:00 AM to 2:00 PM EST, allowing you to design a schedule that works for your life.",
            icon: <Compass size={24} />,
            recruiterSubject: "Ask about remote work models"
        },
        {
            title: "Unlimited or Generous PTO",
            stat: "4 weeks minimum taken",
            desc: "Trust-based leave designed to prevent candidate burnout.",
            longDesc: "Take care of yourself. Our trust-based PTO policy has a mandatory 4-week minimum requirement. We also offer fully paid sabbatical leave after 4 years of continuous service.",
            icon: <Clock size={24} />,
            recruiterSubject: "Ask about PTO and sabbaticals"
        },
        {
            title: "Mental Health Support",
            stat: "100% employer covered",
            desc: "Free therapy apps, virtual counseling, and employee wellbeing tools.",
            longDesc: "Holistic wellness support. Receive free, unlimited access to premium therapy apps, virtual counseling sessions, and 12 fully covered therapy sessions per year for you and your family.",
            icon: <Smile size={24} />,
            recruiterSubject: "Ask about mental health apps"
        },
        {
            title: "Wellness Stipends",
            stat: "₹50,000 annual stipend",
            desc: "Monthly budget for fitness trackers, gym memberships, and healthy lifestyle choices.",
            longDesc: "Fuel your healthy habits. Get a monthly stipend of ₹4,000 to spend on gym memberships, fitness equipment, meal delivery kits, meditation apps, or athletic gear.",
            icon: <Heart size={24} />,
            recruiterSubject: "Ask about wellness stipends"
        }
    ];

    // ─── 3. Build Your Package Preferences ───
    const [prefFlex, setPrefFlex] = useState(false);
    const [prefGrowth, setPrefGrowth] = useState(false);
    const [prefWell, setPrefWell] = useState(false);
    const [prefSec, setPrefSec] = useState(false);

    // ─── 4. Download Form ───
    const [downloadEmail, setDownloadEmail] = useState('');
    const [downloaded, setDownloaded] = useState(false);

    const handleDownload = (e: React.FormEvent) => {
        e.preventDefault();
        if (downloadEmail.trim()) {
            setDownloaded(true);
            setTimeout(() => {
                setDownloaded(false);
                setDownloadEmail('');
            }, 5000);
        }
    };

    return (
        <main className={styles.page}>
            {/* Ken Burns Animated Background Layer */}
            <div className={styles.bgWrapper}>
                <div className={styles.bgImage} />
                <div className={styles.bgOverlay} />
            </div>

            {/* 1. Hero Section (Completely Unchanged layout per user request) */}
            <section className={styles.hero}>
                <div className={styles.heroLayout}>
                    <div className={styles.heroContent}>
                        <div className={styles.aiBadge}>
                            <IconSparkle /> Jobs • Careers • Hiring
                        </div>
                        <h1 className={styles.heroTitle}>
                            Find Work That <span className={styles.heroHighlight}>Moves You Forward</span>
                        </h1>
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
                    </div>
                </div>
            </section>

            {/* 2. Total Rewards Visualizer */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.section}>
                    <div className={styles.sectionInner}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionBadge}>Calculator</div>
                            <h2 className={styles.sectionTitle}>
                                Total Rewards <span className={styles.highlightText}>Visualizer</span>
                            </h2>
                            <p className={styles.sectionDesc}>
                                Look beyond the base salary. Drag the slider and toggle benefits to calculate the full monetary value of our comprehensive candidate compensation plan.
                                <em> Recent data shows 49% of global job seekers rank &quot;better benefits&quot; as a top driver for changing jobs, second only to higher pay.</em>
                            </p>
                        </div>

                        <div className={`${styles.glassCard} ${styles.calcLayout}`}>
                            {/* Controls */}
                            <div className={styles.calcControls}>
                                <div className={styles.sliderGroup}>
                                    <div className={styles.sliderHeader}>
                                        <span className={styles.sliderLabel}>Base Annual Salary (INR)</span>
                                        <span className={styles.sliderValue}>₹{formatIndianRupees(baseSalary)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="500000"
                                        max="5000000"
                                        step="100000"
                                        value={baseSalary}
                                        onChange={(e) => setBaseSalary(Number(e.target.value))}
                                        className={styles.rangeInput}
                                    />
                                </div>

                                <div className={styles.checkboxesGroup}>
                                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>Employer-Paid Benefits</h4>

                                    <div
                                        className={`${styles.benefitCheckbox} ${healthSelected ? styles.benefitCheckboxActive : ''}`}
                                        onClick={() => setHealthSelected(!healthSelected)}
                                    >
                                        <div className={`${styles.checkboxTick} ${healthSelected ? styles.checkboxTickActive : ''}`}>
                                            {healthSelected && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <div className={styles.benefitMeta}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span className={styles.benefitTitle}>Comprehensive Healthcare Premiums</span>
                                                <span className={styles.benefitValueBadge}>+₹1,50,000/yr</span>
                                            </div>
                                            <p className={styles.benefitDescText}>100% employer-covered health, vision, and dental premiums.</p>
                                        </div>
                                    </div>

                                    <div
                                        className={`${styles.benefitCheckbox} ${retirementSelected ? styles.benefitCheckboxActive : ''}`}
                                        onClick={() => setRetirementSelected(!retirementSelected)}
                                    >
                                        <div className={`${styles.checkboxTick} ${retirementSelected ? styles.checkboxTickActive : ''}`}>
                                            {retirementSelected && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <div className={styles.benefitMeta}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span className={styles.benefitTitle}>Retirement Matching (EPF)</span>
                                                <span className={styles.benefitValueBadge}>+4% matching (₹{formatIndianRupees(retirementVal)})</span>
                                            </div>
                                            <p className={styles.benefitDescText}>100% matching employer contributions matching up to 4% of base salary.</p>
                                        </div>
                                    </div>

                                    <div
                                        className={`${styles.benefitCheckbox} ${wellnessSelected ? styles.benefitCheckboxActive : ''}`}
                                        onClick={() => setWellnessSelected(!wellnessSelected)}
                                    >
                                        <div className={`${styles.checkboxTick} ${wellnessSelected ? styles.checkboxTickActive : ''}`}>
                                            {wellnessSelected && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <div className={styles.benefitMeta}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span className={styles.benefitTitle}>Wellness Stipends</span>
                                                <span className={styles.benefitValueBadge}>+₹50,000/yr</span>
                                            </div>
                                            <p className={styles.benefitDescText}>₹4,000 monthly allowance for gym memberships, fitness gear, or apps.</p>
                                        </div>
                                    </div>

                                    <div
                                        className={`${styles.benefitCheckbox} ${learningSelected ? styles.benefitCheckboxActive : ''}`}
                                        onClick={() => setLearningSelected(!learningSelected)}
                                    >
                                        <div className={`${styles.checkboxTick} ${learningSelected ? styles.checkboxTickActive : ''}`}>
                                            {learningSelected && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <div className={styles.benefitMeta}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span className={styles.benefitTitle}>Learning & Development Budget</span>
                                                <span className={styles.benefitValueBadge}>+₹1,50,000/yr</span>
                                            </div>
                                            <p className={styles.benefitDescText}>Annual allowance for courses, platforms, textbooks, and conferences.</p>
                                        </div>
                                    </div>

                                    <div
                                        className={`${styles.benefitCheckbox} ${hsaSelected ? styles.benefitCheckboxActive : ''}`}
                                        onClick={() => setHsaSelected(!hsaSelected)}
                                    >
                                        <div className={`${styles.checkboxTick} ${hsaSelected ? styles.checkboxTickActive : ''}`}>
                                            {hsaSelected && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <div className={styles.benefitMeta}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span className={styles.benefitTitle}>Tax-Advantaged pension contributions (NPS)</span>
                                                <span className={styles.benefitValueBadge}>+₹50,000/yr</span>
                                            </div>
                                            <p className={styles.benefitDescText}>Tax-advantaged contributions paid directly into your National Pension Scheme account.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Display */}
                            <div className={styles.calcVisual}>
                                <div className={styles.rewardsGauge}>
                                    <span className={styles.gaugeSub}>Total Value Package</span>
                                    <h3 className={styles.gaugeTotal}>₹{formatIndianRupees(totalCompensation)}</h3>
                                    <p className={styles.gaugeBreakdownText}>
                                        Base salary makes up <strong>{baseRatio}%</strong>, and benefits contribute an additional <strong>{benefitsRatio}%</strong> in hidden compensation.
                                    </p>

                                    <div className={styles.calcProgressBar}>
                                        <div className={styles.barBase} style={{ width: `${baseRatio}%` }} />
                                        <div className={styles.barBenefits} style={{ width: `${benefitsRatio}%` }} />
                                    </div>
                                </div>

                                <div className={styles.breakdownList}>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>
                                            <span className={styles.breakdownDot} style={{ background: 'var(--primary-blue, #007BFF)' }} />
                                            Base Annual Salary
                                        </span>
                                        <span className={styles.breakdownValue}>₹{formatIndianRupees(baseSalary)}</span>
                                    </div>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>
                                            <span className={styles.breakdownDot} style={{ background: '#10b981' }} />
                                            Healthcare Premiums
                                        </span>
                                        <span className={styles.breakdownValue}>₹{formatIndianRupees(healthVal)}</span>
                                    </div>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>
                                            <span className={styles.breakdownDot} style={{ background: '#10b981' }} />
                                            Retirement Match (EPF 4%)
                                        </span>
                                        <span className={styles.breakdownValue}>₹{formatIndianRupees(retirementVal)}</span>
                                    </div>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>
                                            <span className={styles.breakdownDot} style={{ background: '#10b981' }} />
                                            Wellness stipends
                                        </span>
                                        <span className={styles.breakdownValue}>₹{formatIndianRupees(wellnessVal)}</span>
                                    </div>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>
                                            <span className={styles.breakdownDot} style={{ background: '#10b981' }} />
                                            L&D allowance
                                        </span>
                                        <span className={styles.breakdownValue}>₹{formatIndianRupees(learningVal)}</span>
                                    </div>
                                    <div className={styles.breakdownItem}>
                                        <span className={styles.breakdownLabel}>
                                            <span className={styles.breakdownDot} style={{ background: '#10b981' }} />
                                            NPS contributions
                                        </span>
                                        <span className={styles.breakdownValue}>₹{formatIndianRupees(hsaVal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 3. "Live Your Best Life" (Flexibility & Wellbeing) */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.section}>
                    <div className={styles.sectionInner}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionBadge}>Integration</div>
                            <h2 className={styles.sectionTitle}>
                                &quot;Live Your Best Life&quot; <span className={styles.highlightText}>(Flexibility & Wellbeing)</span>
                            </h2>
                            <p className={styles.sectionDesc}>
                                Holistic wellbeing is not a perk—it is the foundation of our culture. Flexibility is a core driver of attraction, with work-from-anywhere policies and unlimited PTO ranking as the most desired benefits in 2026.
                            </p>
                        </div>

                        <div className={styles.wellbeingGrid}>
                            {WELLBEING_CARDS.map((card, idx) => {
                                const isOpen = activeWellbeing === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`${styles.glassCard} ${styles.wellbeingCard}`}
                                        onClick={() => setActiveWellbeing(isOpen ? null : idx)}
                                    >
                                        <div className={styles.wellbeingHeader}>
                                            <div className={styles.wellbeingIcon}>
                                                {card.icon}
                                            </div>
                                            <span className={styles.wellbeingStat}>{card.stat}</span>
                                        </div>

                                        <h3 className={styles.wellbeingTitle}>{card.title}</h3>
                                        <p className={styles.wellbeingDesc}>{card.desc}</p>

                                        <div className={`${styles.wellbeingDetail} ${isOpen ? styles.wellbeingDetailOpen : ''}`}>
                                            <div className={styles.wellbeingDivider} />
                                            <p className={styles.wellbeingLongDesc}>{card.longDesc}</p>
                                            <a
                                                href={`mailto:recruiting@talentmesh.com?subject=${encodeURIComponent(card.recruiterSubject)}`}
                                                className={styles.askLink}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Ask a Current Employee <ArrowRight size={14} />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 4. Financial Wellness Hub */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.section}>
                    <div className={styles.sectionInner}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionBadge}>Security</div>
                            <h2 className={styles.sectionTitle}>
                                Financial <span className={styles.highlightText}>Wellness Hub</span>
                            </h2>
                            <p className={styles.sectionDesc}>
                                With rising living expenses, financial wellness is central to the 2026 benefits package, especially for younger workers. We offer robust plans to support your financial security.
                            </p>
                        </div>

                        <div className={styles.wellbeingGrid}>
                            <div className={`${styles.glassCard} ${styles.deiCard}`}>
                                <div className={styles.deiIcon} style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}><Coins size={24} /></div>
                                <h3 className={styles.deiTitle}>Student-Loan Repayment</h3>
                                <p className={styles.deiDesc}>Direct company contributions made monthly to your student loan servicer to help reduce debt principal faster.</p>
                                <span className={styles.deiStat} style={{ background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>Up to ₹10,000/mo match</span>
                            </div>

                            <div className={`${styles.glassCard} ${styles.deiCard}`}>
                                <div className={styles.deiIcon} style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}><GraduationCap size={24} /></div>
                                <h3 className={styles.deiTitle}>Tuition Reimbursement</h3>
                                <p className={styles.deiDesc}>Financial assistance for degree programs, bootcamps, or university classes related to your job track.</p>
                                <span className={styles.deiStat} style={{ background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>Up to ₹2,50,000/yr</span>
                            </div>

                            <div className={`${styles.glassCard} ${styles.deiCard}`}>
                                <div className={styles.deiIcon} style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}><Briefcase size={24} /></div>
                                <h3 className={styles.deiTitle}>Finance Coaching & COLA</h3>
                                <p className={styles.deiDesc}>Free 1-on-1 consultations with Certified Financial Planners (CFPs), alongside regular Cost-of-Living Adjustments.</p>
                                <span className={styles.deiStat} style={{ background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>Free CFP & COLA</span>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 5. Growth & Development Pathways */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.section}>
                    <div className={styles.sectionInner}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionBadge}>Growth</div>
                            <h2 className={styles.sectionTitle}>
                                Growth & <span className={styles.highlightText}>Development Pathways</span>
                            </h2>
                            <p className={styles.sectionDesc}>
                                We frame continuous learning as a tangible career asset. Unlock training budgets, platforms, and pathways to fast promotions.
                            </p>
                        </div>

                        <div className={styles.growthGrid}>
                            <div className={styles.growthContent}>
                                <div className={styles.growthItem}>
                                    <div className={styles.growthItemIcon}><GraduationCap size={20} /></div>
                                    <div className={styles.growthItemContent}>
                                        <h4 className={styles.growthItemTitle}>Certification Budgets</h4>
                                        <p className={styles.growthItemDesc}>Get up to ₹1,50,000 annually to pay for books, online courses, university classes, or professional examinations.</p>
                                    </div>
                                </div>

                                <div className={styles.growthItem}>
                                    <div className={styles.growthItemIcon}><Award size={20} /></div>
                                    <div className={styles.growthItemContent}>
                                        <h4 className={styles.growthItemTitle}>Access to Learning Platforms</h4>
                                        <p className={styles.growthItemDesc}>Complimentary access to learning repositories including Coursera, LinkedIn Learning, and O&apos;Reilly Media.</p>
                                    </div>
                                </div>

                                <div className={styles.growthItem}>
                                    <div className={styles.growthItemIcon}><Briefcase size={20} /></div>
                                    <div className={styles.growthItemContent}>
                                        <h4 className={styles.growthItemTitle}>Clear Internal Mobility Paths</h4>
                                        <p className={styles.growthItemDesc}>Bi-annual career reviews with clear individual contributor (IC) and managerial trajectory options.</p>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.growthDataCard}>
                                <h3 className={styles.growthDataNumber}>85%</h3>
                                <p className={styles.growthDataLabel}>Managers Promoted Internally</p>
                                <p className={styles.growthDataDesc}>
                                    We prioritize hiring from within. Over four-fifths of our active team leads, coordinators, and engineering managers rose through internal promotion paths.
                                </p>
                                <div className={styles.growthDataBar}>
                                    <div className={styles.growthDataFill} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 6. Inclusion & Belonging Initiatives */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.section}>
                    <div className={styles.sectionInner}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionBadge}>DEI</div>
                            <h2 className={styles.sectionTitle}>
                                Inclusion & <span className={styles.highlightText}>Belonging Initiatives</span>
                            </h2>
                            <p className={styles.sectionDesc}>
                                DEI is a core benefit. Supporting diverse perspectives and safe working environments where every employee can grow and succeed.
                            </p>
                        </div>

                        <div className={styles.deiGrid}>
                            <div className={`${styles.glassCard} ${styles.deiCard}`}>
                                <div className={styles.deiIcon}><Users size={24} /></div>
                                <h3 className={styles.deiTitle}>Employee Resource Groups (ERGs)</h3>
                                <p className={styles.deiDesc}>Connect with our 6 active ERGs focusing on LGBTQ+ advocacy, women leaders, neurodiversity, and multicultural heritage.</p>
                                <span className={styles.deiStat}>6 active ERGs</span>
                            </div>

                            <div className={`${styles.glassCard} ${styles.deiCard}`}>
                                <div className={styles.deiIcon}><Smile size={24} /></div>
                                <h3 className={styles.deiTitle}>Accommodations for Neurodiversity</h3>
                                <p className={styles.deiDesc}>Offices built with quiet study zones, soundproofing elements, flexible focus hours, and custom hardware accommodations.</p>
                                <span className={styles.deiStat}>Inclusive Spaces</span>
                            </div>

                            <div className={`${styles.glassCard} ${styles.deiCard}`}>
                                <div className={styles.deiIcon}><Shield size={24} /></div>
                                <h3 className={styles.deiTitle}>Parental Leave Policies</h3>
                                <p className={styles.deiDesc}>Fully paid parental leave available to all biological, adoptive, or surrogate parents, encouraging split-family parenting equality.</p>
                                <span className={styles.deiStat}>16 weeks fully paid</span>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 7. Real Stories, Not Just Policies */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.section}>
                    <div className={styles.sectionInner}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionBadge}>Impact</div>
                            <h2 className={styles.sectionTitle}>
                                Real Stories, <span className={styles.highlightText}>Not Just Policies</span>
                            </h2>
                            <p className={styles.sectionDesc}>
                                Hear directly from our team members on how these benefits translate into support for their personal lifestyles and career paths.
                            </p>
                        </div>

                        <div className={styles.testimonialsGrid}>
                            <div className={`${styles.glassCard} ${styles.testimonialCard}`}>
                                <p className={styles.testimonialQuote}>
                                    &quot;The parental leave policy allowed me to fully bond with my newborn without worrying about my inbox. Returning to work was seamless and supportive.&quot;
                                </p>
                                <div className={styles.testimonialAuthor}>
                                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&fit=crop&auto=format&q=80" alt="Sarah M." className={styles.testimonialAvatar} />
                                    <div>
                                        <h4 className={styles.testimonialName}>Sarah M.</h4>
                                        <p className={styles.testimonialRole}>Lead Software Engineer</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`${styles.glassCard} ${styles.testimonialCard}`}>
                                <p className={styles.testimonialQuote}>
                                    &quot;The wellness stipend helped me completely transform my physical health. I used it to subscribe to healthy meal kits and purchase athletic gear that keeps me active.&quot;
                                </p>
                                <div className={styles.testimonialAuthor}>
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&fit=crop&auto=format&q=80" alt="David K." className={styles.testimonialAvatar} />
                                    <div>
                                        <h4 className={styles.testimonialName}>David K.</h4>
                                        <p className={styles.testimonialRole}>Staff Product Designer</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`${styles.glassCard} ${styles.testimonialCard}`}>
                                <p className={styles.testimonialQuote}>
                                    &quot;Thanks to the annual ₹1,50,000 certification allowance, I studied for and completed my cloud security certifications. My manager integrated my goals directly into my promotion schedule.&quot;
                                </p>
                                <div className={styles.testimonialAuthor}>
                                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&auto=format&q=80" alt="Elena R." className={styles.testimonialAvatar} />
                                    <div>
                                        <h4 className={styles.testimonialName}>Elena R.</h4>
                                        <p className={styles.testimonialRole}>Senior DevOps Engineer</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 8. "Build Your Package" Tool */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.section}>
                    <div className={styles.sectionInner}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionBadge}>Configurator</div>
                            <h2 className={styles.sectionTitle}>
                                &quot;Build Your Package&quot; <span className={styles.highlightText}>Tool</span>
                            </h2>
                            <p className={styles.sectionDesc}>
                                Select the core values that matter most to you to see your customized EVP summary and access matching career recommendations.
                            </p>
                        </div>

                        <div className={`${styles.glassCard} ${styles.packageLayout}`}>
                            {/* Checkbox Options */}
                            <div className={styles.packagePrefs}>
                                <div
                                    className={`${styles.packageOption} ${prefFlex ? styles.packageOptionActive : ''}`}
                                    onClick={() => setPrefFlex(!prefFlex)}
                                >
                                    <div className={`${styles.packageCheck} ${prefFlex ? styles.packageCheckActive : ''}`}>
                                        {prefFlex && <Check size={14} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.packageOptionIcon}><Compass size={18} /></div>
                                    <div className={styles.packageOptionLabel}>
                                        <h4 className={styles.packageOptionTitle}>Work-Life Integration</h4>
                                        <p className={styles.packageOptionDesc}>I value remote work, asynchronous scheduling, and flexible hours.</p>
                                    </div>
                                </div>

                                <div
                                    className={`${styles.packageOption} ${prefGrowth ? styles.packageOptionActive : ''}`}
                                    onClick={() => setPrefGrowth(!prefGrowth)}
                                >
                                    <div className={`${styles.packageCheck} ${prefGrowth ? styles.packageCheckActive : ''}`}>
                                        {prefGrowth && <Check size={14} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.packageOptionIcon}><GraduationCap size={18} /></div>
                                    <div className={styles.packageOptionLabel}>
                                        <h4 className={styles.packageOptionTitle}>Growth & Skill Learning</h4>
                                        <p className={styles.packageOptionDesc}>I care about training allowances, platform licenses, and internal mobility.</p>
                                    </div>
                                </div>

                                <div
                                    className={`${styles.packageOption} ${prefWell ? styles.packageOptionActive : ''}`}
                                    onClick={() => setPrefWell(!prefWell)}
                                >
                                    <div className={`${styles.packageCheck} ${prefWell ? styles.packageCheckActive : ''}`}>
                                        {prefWell && <Check size={14} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.packageOptionIcon}><Heart size={18} /></div>
                                    <div className={styles.packageOptionLabel}>
                                        <h4 className={styles.packageOptionTitle}>Wellbeing & Mental Health</h4>
                                        <p className={styles.packageOptionDesc}>I value wellness allowances, therapy apps, and gym subsidies.</p>
                                    </div>
                                </div>

                                <div
                                    className={`${styles.packageOption} ${prefSec ? styles.packageOptionActive : ''}`}
                                    onClick={() => setPrefSec(!prefSec)}
                                >
                                    <div className={`${styles.packageCheck} ${prefSec ? styles.packageCheckActive : ''}`}>
                                        {prefSec && <Check size={14} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.packageOptionIcon}><Shield size={18} /></div>
                                    <div className={styles.packageOptionLabel}>
                                        <h4 className={styles.packageOptionTitle}>Retirement & Security</h4>
                                        <p className={styles.packageOptionDesc}>I want robust retirement matches, HSA options, and day-one health coverage.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary & Download Output */}
                            <div className={styles.packageSummary}>
                                <h3 className={styles.packageSummaryTitle}>Your Customized EVP Summary</h3>
                                <p className={styles.packageSummaryDesc}>
                                    Here are the key benefits matching your career preferences:
                                </p>

                                <div className={styles.packageSummaryTags}>
                                    {!prefFlex && !prefGrowth && !prefWell && !prefSec ? (
                                        <span className={styles.packageTagEmpty}>Select preferences on the left to see benefits...</span>
                                    ) : (
                                        <>
                                            {prefFlex && <span className={styles.packageTag}>Asynchronous schedule & Remote work</span>}
                                            {prefFlex && <span className={styles.packageTag}>Generous PTO & Recharge weeks</span>}
                                            {prefGrowth && <span className={styles.packageTag}>₹1,50,000 education stipend</span>}
                                            {prefGrowth && <span className={styles.packageTag}>Coursera & O&apos;Reilly licenses</span>}
                                            {prefWell && <span className={styles.packageTag}>₹50,000 annual wellness stipends</span>}
                                            {prefWell && <span className={styles.packageTag}>Free therapy apps & counseling</span>}
                                            {prefSec && <span className={styles.packageTag}>EPF retirement matching match (4%)</span>}
                                            {prefSec && <span className={styles.packageTag}>Immediate Day 1 Health plan</span>}
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <Link href="/browse-jobs" className={styles.packageCta}>
                                        View Recommended Jobs <ArrowRight size={16} />
                                    </Link>
                                    <a
                                        href="mailto:recruiting@talentmesh.com?subject=Chat%20about%20my%20EVP%20benefits%20package"
                                        className={styles.secondaryCta}
                                    >
                                        Ask Me Anything about benefits
                                    </a>
                                </div>

                                <div className={styles.downloadFormContainer}>
                                    <h4 style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '8px', color: 'var(--deep-navy, #000000)' }}>Downloadable Benefits Guide</h4>
                                    <form onSubmit={handleDownload} className={styles.downloadForm}>
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            required
                                            value={downloadEmail}
                                            onChange={(e) => setDownloadEmail(e.target.value)}
                                            className={styles.downloadInput}
                                        />
                                        <button type="submit" className={styles.downloadBtn}>Get Guide PDF</button>
                                    </form>
                                    {downloaded && (
                                        <p className={styles.downloadSuccess}>Success! The 2026 benefits guide PDF link has been sent to your inbox.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* 9. Bottom Reusable CTA Section */}
            <AnimateOnScroll animation="scaleUp">
                <CTA
                    glass
                    title={<>Ready to Find Work That <span className="text-gradient">Moves You?</span></>}
                    description="Join thousands of specialists utilizing TalentMesh to accelerate their career paths. Register your profile in under 5 minutes."
                    buttonText="Create Your Profile Now"
                    buttonLink="/signup"
                />
            </AnimateOnScroll>
        </main>
    );
}
