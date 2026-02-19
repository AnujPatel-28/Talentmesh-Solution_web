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
                            <Link href="/companies" className={styles.dropdownLink}>Browse Companies</Link>
                            <Link href="/salaries" className={styles.dropdownLink}>Salary Guide</Link>
                            <Link href="/career-advice" className={styles.dropdownLink}>Career Advice</Link>
                        </div>
                    </div>

                    <div className={styles.navItem}>
                        <div className={styles.link}>
                            For Employers <span style={{ fontSize: '10px' }}>▼</span>
                        </div>
                        <div className={styles.dropdown}>
                            <Link href="/employers/products" className={styles.dropdownLink}>Products & Pricing</Link>
                            <Link href="/employers/post-job" className={styles.dropdownLink}>Post a Job</Link>
                            <Link href="/employers/sourcing" className={styles.dropdownLink}>Talent Sourcing</Link>
                            <Link href="/case-studies" className={styles.dropdownLink}>Success Stories</Link>
                        </div>
                    </div>

                    <div className={styles.navItem}>
                        <div className={styles.link}>
                            Company <span style={{ fontSize: '10px' }}>▼</span>
                        </div>
                        <div className={styles.dropdown}>
                            <Link href="/about" className={styles.dropdownLink}>About Us</Link>
                            <Link href="/contact" className={styles.dropdownLink}>Contact</Link>
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
                </button>
            </div>

            {/* Mobile Navigation Drawer */}
            <div className={`${styles.mobileNav} ${isMenuOpen ? styles.open : ''}`}>
                <div className={styles.mobileNavItem}>
                    <span className={styles.mobileNavLabel}>Find Work</span>
                    <Link href="/jobs" className={styles.mobileNavLink}>Browse Jobs</Link>
                    <Link href="/companies" className={styles.mobileNavLink}>Browse Companies</Link>
                    <Link href="/salaries" className={styles.mobileNavLink}>Salary Guide</Link>
                </div>

                <div className={styles.mobileNavItem}>
                    <span className={styles.mobileNavLabel}>For Employers</span>
                    <Link href="/employers/post-job" className={styles.mobileNavLink}>Post a Job</Link>
                    <Link href="/employers/sourcing" className={styles.mobileNavLink}>Talent Sourcing</Link>
                    <Link href="/employers/products" className={styles.mobileNavLink}>Pricing</Link>
                </div>

                <div className={styles.mobileNavItem}>
                    <span className={styles.mobileNavLabel}>Company</span>
                    <Link href="/about" className={styles.mobileNavLink}>About Us</Link>
                    <Link href="/contact" className={styles.mobileNavLink}>Contact</Link>
                    <Link href="/blog" className={styles.mobileNavLink}>Blog</Link>
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
