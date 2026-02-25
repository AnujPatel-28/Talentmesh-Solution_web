import { PageHeader } from '@/components/ui';
import { Marquee } from '@/components/ui';
import { PremiumCardGrid } from '@/components/ui';
import { SuperhumanPowers, CTA } from '@/components/sections';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AdsClickOutlinedIcon from '@mui/icons-material/AdsClickOutlined';

export default function FeaturesPage() {
    return (
        <main style={{ background: '#fff' }}>
            <PageHeader
                title="Engineered for"
                highlight="performance"
                description="Explore the advanced AI infrastructure that makes TalentMesh the fastest recruitment platform."
                breadcrumb="Platform Features"
            />

            <Marquee />

            <SuperhumanPowers />

            <section className="premium-section">
                <div className="premium-container premium-grid-2" style={{ alignItems: 'center' }}>
                    <div>
                        <span style={{ color: 'var(--primary-blue)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem' }}>Neural Infrastructure</span>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--deep-navy)', margin: '1.5rem 0' }}>The Aura AI Engine</h2>
                        <p style={{ color: 'var(--medium-grey)', fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '2.5rem' }}>
                            Unlike traditional keyword matching, Aura uses a multi-dimensional neural network to understand semantic relationships.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {[
                                { icon: <PsychologyOutlinedIcon sx={{ color: 'var(--primary-blue)' }} />, title: "Semantic Analysis", text: "Identifies that a 'Product Engineer' might be a better fit than a 'React Developer' for certain roles." },
                                { icon: <StorageOutlinedIcon sx={{ color: 'var(--primary-blue)' }} />, title: "Contextual Mapping", text: "Maps 50+ data points including past company size, growth stages, and team structures." }
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '1.5rem' }}>
                                    <div style={{ flexShrink: 0 }}>{item.icon}</div>
                                    <div>
                                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{item.title}</h4>
                                        <p style={{ color: 'var(--medium-grey)', fontSize: '0.95rem' }}>{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '4rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🧠</div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                {[1, 1, 1, 1].map((_, i) => (
                                    <div key={i} style={{ width: '12px', height: '40px', background: 'var(--primary-blue)', borderRadius: '6px', opacity: 1 - (i * 0.2) }}></div>
                                ))}
                            </div>
                            <p style={{ marginTop: '2rem', fontWeight: 700, color: 'var(--deep-navy)' }}>Real-time Signal Processing</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Unique Section 2: Integrations Ecosystem */}
            <section className="premium-section" style={{ background: 'var(--light-ice-blue)' }}>
                <div className="premium-container">
                    <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em' }}>Fits into your workflow.</h2>
                        <p style={{ color: 'var(--medium-grey)', fontSize: '1.25rem', marginTop: '1rem' }}>Seamless integrations with the tools your team already loves.</p>
                    </div>

                    <div className="premium-grid-4">
                        {['Slack', 'Jira', 'Notion', 'Google Calendar', 'Greenhouse', 'Lever', 'Workday', 'Microsoft Teams'].map((tool, i) => (
                            <div key={i} style={{ background: '#ffffff', padding: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,123,255,0.1)', textAlign: 'center', transition: 'transform 0.3s ease', cursor: 'pointer' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</div>
                                <h4 style={{ fontWeight: 800 }}>{tool}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <PremiumCardGrid items={[
                { icon: <LockOutlinedIcon />, title: "Bank-Grade Security", desc: "Your data is encrypted at rest and in transit with SOC2 Compliance." },
                { icon: <AccountTreeOutlinedIcon />, title: "Custom Workflows", desc: "Build automated hiring stages that match your specific organizational needs." },
                { icon: <AdsClickOutlinedIcon />, title: "Bulk Operations", desc: "Manage 1,000+ candidates as easily as you manage one." }
            ]} />

            <CTA />
        </main>
    );
}


