"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const pathname = usePathname();

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Close menu when route changes
    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo} onClick={scrollToTop}>
                    <Image
                        src="/TalentMesh_page-0002-removebg-preview.png"
                        alt="TalentMesh"
                        width={180}
                        height={50}
                        priority
                        className={styles.logoImg}
                        unoptimized
                    />
                </Link>

                <div className={styles.links}>
                    <div className={styles.navItem}>
                        <div className={styles.link}>
                            Find Work <span style={{ fontSize: '10px' }}>▼</span>
                        </div>
                        <div className={styles.dropdown}>
                            <Link href="/jobs" className={styles.dropdownLink}>Browse Jobs</Link>
                            <Link href="/job-seekers" className={styles.dropdownLink}>Candidate Benefits</Link>
                            <Link href="/career-advice" className={styles.dropdownLink}>Career Advice</Link>
                        </div>
                    </div>

                    <div className={styles.navItem}>
                        <div className={styles.link}>
                            For Employers <span style={{ fontSize: '10px' }}>▼</span>
                        </div>
                        <div className={styles.dropdown}>
                            <Link href="/employers" className={styles.dropdownLink}>Employers</Link>
                            <Link href="/pricing" className={styles.dropdownLink}>Pricing</Link>
                            <Link href="/case-studies" className={styles.dropdownLink}>Success Stories</Link>
                            <Link href="/features" className={styles.dropdownLink}>AI Features</Link>
                        </div>
                    </div>

                    <div className={styles.navItem}>
                        <div className={styles.link}>
                            Company <span style={{ fontSize: '10px' }}>▼</span>
                        </div>
                        <div className={styles.dropdown}>
                            <Link href="/about" className={styles.dropdownLink}>About</Link>
                            <Link href="/contact" className={styles.dropdownLink}>Contact</Link>
                            <Link href="/careers" className={styles.dropdownLink}>Careers</Link>
                            <Link href="/blog" className={styles.dropdownLink}>Blog</Link>
                            <Link href="/press" className={styles.dropdownLink}>Press</Link>
                        </div>
                    </div>
                </div>

                <div className={styles.auth}>
                    <Link href="/login" className={styles.loginBtn}>Login</Link>
                    <Link href="/signup" className={styles.signupBtn}>Get Started</Link>
                </div>

                {/* Mobile Toggle Button */}
                <button
                    className={`${styles.mobileToggle} ${isMenuOpen ? styles.open : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span className={styles.bar}></span>
                    <span className={styles.bar}></span>
                    <span className={styles.bar}></span>
                </button>
            </div>

            {/* Mobile Navigation Drawer */}
            <div className={`${styles.mobileNav} ${isMenuOpen ? styles.open : ''}`}>
                <div className={styles.mobileNavItem}>
                    <span className={styles.mobileNavLabel}>Employers</span>
                    <Link href="/employers" className={styles.mobileNavLink}>Employers</Link>
                    <Link href="/pricing" className={styles.mobileNavLink}>Pricing</Link>
                    <Link href="/case-studies" className={styles.mobileNavLink}>Success Stories</Link>
                    <Link href="/features" className={styles.mobileNavLink}>AI Features</Link>
                </div>

                <div className={styles.mobileNavItem}>
                    <span className={styles.mobileNavLabel}>Job Seekers</span>
                    <Link href="/jobs" className={styles.mobileNavLink}>Browse Jobs</Link>
                    <Link href="/job-seekers" className={styles.mobileNavLink}>Candidate Benefits</Link>
                    <Link href="/career-advice" className={styles.mobileNavLink}>Career Advice</Link>
                </div>

                <div className={styles.mobileNavItem}>
                    <span className={styles.mobileNavLabel}>Company</span>
                    <Link href="/about" className={styles.mobileNavLink}>About</Link>
                    <Link href="/contact" className={styles.mobileNavLink}>Contact</Link>
                    <Link href="/careers" className={styles.mobileNavLink}>Careers</Link>
                    <Link href="/blog" className={styles.mobileNavLink}>Blog</Link>
                    <Link href="/press" className={styles.mobileNavLink}>Press</Link>
                </div>

                <div className={styles.mobileAuth}>
                    <Link href="/signup" className={styles.signupBtn} style={{ textAlign: 'center', justifyContent: 'center' }}>
                        Get Started
                    </Link>
                    <Link href="/login" className={styles.mobileLogin}>
                        Log In
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
