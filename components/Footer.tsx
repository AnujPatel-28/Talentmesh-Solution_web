import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.branding}>
                        <Link href="/" className={styles.logo}>
                            <Image src="/TalentMesh_page-0002-removebg-preview.png" alt="TalentMesh" width={150} height={34} />
                        </Link>
                        <p className={styles.description}>
                            Revolutionizing recruitment with advanced AI matching technology.
                            Connecting top talent with world-class companies.
                        </p>
                    </div>

                    <div className={styles.column}>
                        <h4>Platform</h4>
                        <Link href="/employers">For Employers</Link>
                        <Link href="/job-seekers">For Job Seekers</Link>
                        <Link href="/pricing">Pricing</Link>
                        <Link href="/features">AI Features</Link>
                    </div>

                    <div className={styles.column}>
                        <h4>Company</h4>
                        <Link href="/about">About Us</Link>
                        <Link href="/careers">Careers</Link>
                        <Link href="/blog">Blog</Link>
                        <Link href="/contact">Contact</Link>
                    </div>

                    <div className={styles.column}>
                        <h4>Legal</h4>
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                        <Link href="/security">Security</Link>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>&copy; {new Date().getFullYear()} AI Recruit. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
