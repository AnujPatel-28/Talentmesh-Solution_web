import styles from './sections.module.css';

const FAQ = () => {
    return (
        <section className={styles.faq}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <div className={styles.badge}>Support</div>
                    <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
                </div>

                <div className={styles.faqGrid}>
                    <div className={styles.faqItem}>
                        <div className={styles.question}>How does the AI matching work?</div>
                        <div className={styles.answer}>
                            Our AI analyzes your skills, experience, and preferences against thousands of job descriptions to find the perfect mutual fit, reducing hiring time by 75%.
                        </div>
                    </div>
                    <div className={styles.faqItem}>
                        <div className={styles.question}>Is my data private?</div>
                        <div className={styles.answer}>
                            Yes. We are GDPR compliant and use enterprise-grade encryption. Employers only see your full profile when you approve a match request.
                        </div>
                    </div>
                    <div className={styles.faqItem}>
                        <div className={styles.question}>Can I use it for free?</div>
                        <div className={styles.answer}>
                            Absolutely. Job seekers can create a profile and browse matches for free. We also offer a free tier for small businesses posting their first job.
                        </div>
                    </div>
                    <div className={styles.faqItem}>
                        <div className={styles.question}>Do you support remote jobs?</div>
                        <div className={styles.answer}>
                            Yes! Over 60% of the roles on TalentMesh are remote-friendly or fully remote, spaninng across 40+ countries.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQ;

