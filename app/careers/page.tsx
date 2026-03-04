import { PageHeader } from '@/components/ui';
import { JobListings, CTA, Stats } from '@/components/sections';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import LaptopOutlinedIcon from '@mui/icons-material/LaptopOutlined';
import styles from './careers.module.css';

export default function CareersPage() {
    return (
        <main className={styles.page}>
            <PageHeader
                title="Build the future"
                highlight="with us"
                description="We're a team of engineers, designers, and dreamers building the next generation of talent infrastructure."
                breadcrumb="Life at TalentMesh"
            />

            <Stats />

            {/* ── Our Culture ── */}
            <section className={styles.cultureSection}>
                <div className={styles.cultureGrid}>
                    <div className={styles.cultureCards}>
                        {[
                            {
                                color: 'Blue', label: 'Innovation', icon: (
                                    <svg className={styles.cultureCardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                                    </svg>
                                )
                            },
                            {
                                color: 'Green', label: 'Diversity', icon: (
                                    <svg className={styles.cultureCardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                )
                            },
                            {
                                color: 'Red', label: 'Speed', icon: (
                                    <svg className={styles.cultureCardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                )
                            },
                            {
                                color: 'Purple', label: 'Empathy', icon: (
                                    <svg className={styles.cultureCardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                )
                            },
                        ].map((box, i) => (
                            <div key={i} className={`${styles.cultureCard} ${styles[`cultureCard${box.color}`]}`}>
                                {box.icon}
                                {box.label}
                            </div>
                        ))}
                    </div>
                    <div className={styles.cultureContent}>
                        <span className={styles.cultureSectionTag}>Workplace Evolution</span>
                        <h2 className={styles.cultureTitle}>As remote as you are.</h2>
                        <p className={styles.cultureDesc}>
                            We believe that the best talent shouldn&apos;t be restricted by geography. TalentMesh is a remote-first organization with hubs in Ahmedabad, San Francisco, and London.
                        </p>
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

            {/* ── Open Positions ── */}
            <section className={styles.positionsSection}>
                <div className="premium-container">
                    <div className={styles.positionsHeader}>
                        <h2 className={styles.positionsTitle}>Open Positions</h2>
                        <p className={styles.positionsSubtitle}>Find your next challenge and grow with us.</p>
                    </div>
                    <JobListings />
                </div>
            </section>

            {/* ── Benefits Matrix ── */}
            <section className={styles.benefitsSection}>
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
            </section>

            <CTA />
        </main>
    );
}
