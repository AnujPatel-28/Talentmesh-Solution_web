import { Twitter, Linkedin, Instagram } from 'lucide-react';
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
                        <div className={styles.newsletter}>
                            <h4 style={{ color: 'white', fontWeight: 700 }}>Stay in the loop</h4>
                            <div className={styles.newsletterInputWrapper}>
                                <input type="email" placeholder="Enter your email" className={styles.newsletterInput} />
                                <button className={styles.newsletterBtn}>Subscribe</button>
                            </div>
                        </div>
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
                    <p>&copy; {new Date().getFullYear()} TalentMesh. All rights reserved.</p>
                    <div className={styles.socials}>
                        <a href="https://x.com/TalentmeshS" className={`${styles.socialIcon} ${styles.twitter}`} aria-label="X (Twitter)">
                            <Twitter size={18} />
                        </a>
                        <a href="https://talentmeshsolutions.com/" className={`${styles.socialIcon} ${styles.linkedin}`} aria-label="LinkedIn">
                            <Linkedin size={18} />
                        </a>
                        <a href="https://www.instagram.com/talentmesh_?igsh=NzFidGN2bDc4YzNx" className={`${styles.socialIcon} ${styles.instagram}`} aria-label="Instagram">
                            <Instagram size={18} />
                        </a>
                    </div>
                </div>
            </div>
            <div className={styles.footerBranding}>TALENTMESH</div>
        </footer>
    );
};

export default Footer;
