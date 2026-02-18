import Image from 'next/image';
import styles from './landing.module.css';

const Stats = () => {
    // Content to repeat. We repeat it enough times to fill screens and loop seamlessly.
    const items = [
        "The future is awaiting for you",
        "Build your career",
        "The future is awaiting for you",
        "Build your career",
        "The future is awaiting for you",
        "Build your career",
        "The future is awaiting for you",
        "Build your career",
    ];

    return (
        <section className={styles.statsMarquee}>
            <div className={styles.marqueeContainer}>
                <div className={styles.marqueeTrack}>
                    {[...items, ...items].map((text, i) => (
                        <div key={i} className={styles.marqueeItem}>
                            <div className={styles.marqueeLogoWrapper}>
                                <Image
                                    src="/TalentMesh White Logo.png"
                                    alt="TalentMesh"
                                    width={72}
                                    height={72}
                                    className={styles.marqueeLogo}
                                />
                            </div>
                            <span className={styles.marqueeText}>{text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Stats;
