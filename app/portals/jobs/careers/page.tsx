"use client";
import { PageHeader } from '@/components/ui';
import Image from 'next/image';
import { JobListings, CTA, Stats } from '@/components/sections';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import LaptopOutlinedIcon from '@mui/icons-material/LaptopOutlined';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import styles from './careers.module.css';

import { SectionHeader } from '@/components/ui';

export default function CareersPage() {
    return (
        <main className={styles.page}>
            <PageHeader
                title="Build the future"
                highlight="with us"
                description="We're a team of engineers, designers, and dreamers building the next generation of talent infrastructure."
                breadcrumb="Life at TalentMesh"
            />

            <AnimateOnScroll animation="scaleUp">
                <Stats />
            </AnimateOnScroll>

            {/* ── Our Culture ── */}
            <AnimateOnScroll animation="fadeUp">
                <section className={styles.cultureSection}>
                    <div className={styles.cultureGrid}>
                        <div className={styles.cultureImageWrapper}>
                            <Image
                                src="/images/careers-team.jpg"
                                alt="TalentMesh Team Collaboration"
                                fill
                                className={styles.cultureImg}
                                priority
                            />
                        </div>
                        <div className={styles.cultureContent}>
                            <SectionHeader
                                tag="Workplace Evolution"
                                title="As remote as you are."
                                description="We believe that the best talent shouldn't be restricted by geography. TalentMesh is a remote-first organization with hubs in Ahmedabad, San Francisco, and London."
                            />
                            <ul className={styles.perksList}>
                                {[
                                    { icon: <LaptopOutlinedIcon sx={{ fontSize: 18 }} />, text: "Remote-first culture with flex-hours" },
                                    { icon: <PublicOutlinedIcon sx={{ fontSize: 18 }} />, text: "Coworking stipends in 50+ countries" },
                                    { icon: <FavoriteOutlinedIcon sx={{ fontSize: 18 }} />, text: "Comprehensive family leave & wellness" }
                                ].map((li, idx) => (
                                    <li key={idx} className={styles.perksItem}>
                                        <span className={styles.perksIcon}>{li.icon}</span>
                                        {li.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            {/* ── Open Positions ── */}
            <AnimateOnScroll animation="fadeUp" delay={100}>
                <section className={styles.positionsSection}>
                    <div className="premium-container">
                        <SectionHeader
                            centered
                            tag="Opportunities"
                            title="Open Positions"
                            description="Find your next challenge and grow with us."
                        />
                        <JobListings />
                    </div>
                </section>
            </AnimateOnScroll>

            {/* ── Benefits Matrix ── */}
            <AnimateOnScroll animation="fadeUp" delay={150}>
                <section className={styles.benefitsSection}>
                    <div className="premium-container">
                        <SectionHeader
                            centered
                            tag="Perks"
                            title="Benefits of joining the mesh."
                        />
                        <div className={styles.benefitsGrid}>
                        {[
                            { icon: <BoltOutlinedIcon />, title: "Learning", text: "$2.5k annual learning budget." },
                            { icon: <LocalCafeOutlinedIcon />, title: "Perks", text: "Healthy snacks & coffee stipends." },
                            { icon: <VerifiedUserOutlinedIcon />, title: "Health", text: "Premium global medical coverage." },
                            { icon: <LaptopOutlinedIcon />, title: "Stock", text: "Equity options for all employees." }
                        ].map((item, i) => (
                            <div key={i} className={styles.benefitCard}>
                                <div className={styles.benefitIcon}>{item.icon}</div>
                                <h4 className={styles.benefitTitle}>{item.title}</h4>
                                <p className={styles.benefitText}>{item.text}</p>
                            </div>
                        ))}
                        </div>
                    </div>
                </section>
            </AnimateOnScroll>

            <AnimateOnScroll animation="scaleUp">
                <CTA />
            </AnimateOnScroll>
        </main>
    );
}
