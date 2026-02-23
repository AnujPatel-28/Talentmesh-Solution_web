import PageHeader from '@/components/PageHeader';
import ContentCard from '@/components/ContentCard';
import { CTA } from '@/components/landing';

const BLOG_POSTS = [
    {
        title: "The Future of AI in Recruitment",
        description: "How machine learning is changing the way we find and vet top engineering talent in 2026.",
        category: "Technology",
        date: "Feb 15, 2026",
        link: "/blog/future-of-ai",
        icon: "🤖"
    },
    {
        title: "Navigating Remote Work Culture",
        description: "Best practices for maintaining team cohesion and productivity in a distributed environment.",
        category: "Culture",
        date: "Feb 10, 2026",
        link: "/blog/remote-culture",
        icon: "🏠"
    },
    {
        title: "Mastering the Technical Interview",
        description: "A comprehensive guide for candidates to excel in high-stakes engineering interviews.",
        category: "Career Advice",
        date: "Feb 05, 2026",
        link: "/blog/technical-interview",
        icon: "💻"
    }
];

export default function BlogPage() {
    return (
        <main>
            <PageHeader
                title="Insights &"
                highlight="perspectives"
                description="The latest thoughts from our team on AI, hiring, and the future of work."
                breadcrumb="Our Blog"
            />

            <div className="premium-container" style={{ padding: '6rem 2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
                    {BLOG_POSTS.map((post, i) => (
                        <ContentCard key={i} {...post} image="placeholder" />
                    ))}
                </div>
            </div>

            <div className="premium-container" style={{ padding: '0 2rem 8rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '4rem' }}>
                    {/* Main Sidebar (Categories) */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
                            {['All Posts', 'Technology', 'Culture', 'Career Advice', 'Engineering', 'Design', 'Product'].map((cat, i) => (
                                <button key={i} style={{ padding: '0.75rem 1.5rem', borderRadius: '50px', border: '1px solid #e2e8f0', background: i === 0 ? 'var(--primary-blue)' : '#fff', color: i === 0 ? '#fff' : 'var(--deep-navy)', fontWeight: 600, cursor: 'pointer' }}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--gradient-premium)', borderRadius: 'var(--radius-lg)', padding: '6rem 4rem', textAlign: 'center', color: '#fff' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>Never miss an update.</h2>
                    <p style={{ opacity: 0.8, marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        Get the latest insights on AI recruitment and talent strategy delivered straight to your inbox.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', maxWidth: '500px', margin: '0 auto' }}>
                        <input type="email" placeholder="Enter your email" style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} />
                        <button style={{ padding: '1rem 2rem', background: '#fff', color: 'var(--deep-navy)', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}>Subscribe</button>
                    </div>
                </div>
            </div>

            <CTA />
        </main>
    );
}
