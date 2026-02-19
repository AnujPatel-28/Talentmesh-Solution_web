import styles from './landing.module.css';

const testimonials = [
    {
        quote: "TalentMesh cut our hiring time in half. The quality of candidates we received was unmatched by any other platform we've used.",
        author: "Sarah Jenkins",
        role: "Head of People, TechFlow",
        initials: "SJ"
    },
    {
        quote: "I stopped applying to black holes. On TalentMesh, companies reached out to me, and I had 3 offers in a week. Incredible experience.",
        author: "Michael Kim",
        role: "Senior Product Designer",
        initials: "MK"
    },
    {
        quote: "The bias-free matching is a game changer. We've built our most diverse and high-performing team yet using this tool.",
        author: "Amanda Lee",
        role: "CTO, InnovateX",
        initials: "AL"
    },
    {
        quote: "Finally, a platform that understands nuances. It matched me with a role that perfectly fits my niche skills and culture preference.",
        author: "David Ross",
        role: "Lead DevOps Engineer",
        initials: "DR"
    },
    {
        quote: "We scaled our engineering team from 5 to 50 in three months using TalentMesh. It's the only tool that could keep up with our pace.",
        author: "Elena Rodriguez",
        role: "VP Engineering, ScaleUp",
        initials: "ER"
    }
];

const Testimonials = () => {
    // Duplicate for infinite scroll effect
    const allTestimonials = [...testimonials, ...testimonials, ...testimonials];

    return (
        <section className={styles.testimonials}>
            <div className={styles.testimonialHeader}>
                <div className={styles.badge}>Success Stories</div>
                <h2 className={styles.sectionTitle}>Loved by Recruiters & Talent</h2>
                <p className={styles.sectionDesc}>
                    Join thousands of companies and candidates finding their perfect match every day.
                </p>
            </div>

            <div className={styles.testimonialMarquee}>
                <div className={styles.testimonialTrack}>
                    {allTestimonials.map((t, index) => (
                        <div key={index} className={styles.testimonialCard}>
                            <p className={styles.quote}>{t.quote}</p>
                            <div className={styles.author}>
                                <div className={styles.avatar}>{t.initials}</div>
                                <div className={styles.authorInfo}>
                                    <h4>{t.author}</h4>
                                    <p>{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
