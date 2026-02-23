import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import ContentCard from '@/components/ContentCard';
import { CTA } from '@/components/landing';

const PRESS_RELEASES = [
    {
        title: "TalentMesh Raises $50M Series B",
        description: "Expansion into APAC and EMEA markets to accelerate AI recruitment innovation.",
        category: "Company News",
        date: "Jan 20, 2026",
        link: "/press/series-b",
        icon: "📈"
    },
    {
        title: "New AI Engine Launch",
        description: "Announcing 'Aura', the first neural network designed for bias-free candidate matching.",
        category: "Product",
        date: "Dec 12, 2025",
        link: "/press/aura-launch",
        icon: "🚀"
    },
    {
        title: "Sustainability Initiative",
        description: "TalentMesh commits to net-zero operations by 2030 through green infrastructure.",
        category: "ESG",
        date: "Nov 28, 2025",
        link: "/press/sustainability",
        icon: "🌱"
    }
];

export default function PressPage() {
    return (
        <main>
            <PageHeader
                title="Press &"
                highlight="media hub"
                description="The latest official news, announcements, and media assets from TalentMesh."
                breadcrumb="Press Room"
            />

            <div className="premium-container" style={{ padding: '6rem 2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
                    {PRESS_RELEASES.map((press, i) => (
                        <ContentCard key={i} {...press} image="placeholder" />
                    ))}
                </div>
            </div>

            <div className="premium-container" style={{ padding: '0 2rem 8rem' }}>
                <div style={{ background: 'var(--light-ice-blue)', borderRadius: 'var(--radius-lg)', padding: '4rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--deep-navy)', marginBottom: '1rem' }}>Media Resources</h2>
                    <p style={{ color: 'var(--medium-grey)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        Download our official logos, brand guidelines, and leadership photos for press use.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                        {['Brand Kit', 'Logo Pack', 'Photos', 'Fact Sheet'].map((item, i) => (
                            <div key={i} style={{ background: '#ffffff', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📥</div>
                                <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{item}</h4>
                                <Link href="#" style={{ color: 'var(--primary-blue)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>Download PDF</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <CTA />
        </main>
    );
}
