import PageHeader from '@/components/PageHeader';
import { JobListings, CTA, Stats } from '@/components/landing';
import { Heart, Globe2, ShieldCheck, Zap, Coffee, Laptop } from 'lucide-react';

export default function CareersPage() {
    return (
        <main style={{ background: '#fff' }}>
            <PageHeader
                title="Build the future"
                highlight="with us"
                description="We&apos;re a team of engineers, designers, and dreamers building the next generation of talent infrastructure."
                breadcrumb="Life at TalentMesh"
            />

            <Stats />

            {/* Unique Section 1: Our Culture */}
            <section className="premium-section">
                <div className="premium-container premium-grid-2" style={{ alignItems: 'center' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                        {[
                            { color: '#eff6ff', label: 'Innovation' },
                            { color: '#f0fdf4', label: 'Diversity' },
                            { color: '#fef2f2', label: 'Speed' },
                            { color: '#faf5ff', label: 'Empathy' }
                        ].map((box, i) => (
                            <div key={i} style={{ aspectRatio: '1/1', background: box.color, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--deep-navy)', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                {box.label}
                            </div>
                        ))}
                    </div>
                    <div>
                        <span style={{ color: 'var(--primary-blue)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem' }}>Workplace Evolution</span>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--deep-navy)', margin: '1.5rem 0' }}>As remote as you are.</h2>
                        <p style={{ color: 'var(--medium-grey)', fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '2.5rem' }}>
                            We believe that the best talent shouldn&apos;t be restricted by geography. TalentMesh is a remote-first organization with hubs in Ahmedabad, San Francisco, and London.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {[
                                { icon: <Laptop size={18} />, text: "Remote-first culture with flex-hours" },
                                { icon: <Globe2 size={18} />, text: "Coworking stipends in 50+ countries" },
                                { icon: <Heart size={18} />, text: "Comprehensive family leave & wellness" }
                            ].map((li, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem', fontWeight: 600, color: 'var(--deep-navy)' }}>
                                    <span style={{ color: 'var(--primary-blue)' }}>{li.icon}</span> {li.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Unique Section 2: Open Roles */}
            <section className="premium-section" style={{ background: '#f8fafc' }}>
                <div className="premium-container">
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em' }}>Open Positions</h2>
                        <p style={{ color: 'var(--medium-grey)', marginTop: '1rem' }}>Find your next challenge and grow with us.</p>
                    </div>
                    <JobListings />
                </div>
            </section>

            {/* Unique Section 3: Benefits Matrix */}
            <section className="premium-section">
                <div className="premium-container">
                    <div className="premium-grid-4">
                        {[
                            { icon: <Zap />, title: "Learning", text: "$2.5k annual learning budget." },
                            { icon: <Coffee />, title: "Perks", text: "Healthy snacks & coffee stipends." },
                            { icon: <ShieldCheck />, title: "Health", text: "Premium global medical coverage." },
                            { icon: <Laptop />, title: "Stock", text: "Equity options for all employees." }
                        ].map((item, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--primary-blue)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                                <h4 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>{item.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--medium-grey)' }}>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <CTA />
        </main>
    );
}
