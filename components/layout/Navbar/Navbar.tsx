"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const pathname = usePathname();

    // ── Hide the Navbar entirely inside the dashboard (it has its own layout) ──
    if (pathname.startsWith('/dashboard')) return null;

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsMenuOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(prev => !prev);

    // Close mobile menu on route change
    React.useEffect(() => { setIsMenuOpen(false); }, [pathname]);

    // Helper – returns true when the pathname starts with the given base
    const isActive = (base: string) => pathname.startsWith(base);

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                {/* ── Logo ── */}
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

                {/* ── Desktop Nav ── */}
                <div className={styles.links}>

                    {/* Find Work */}
                    <div className={styles.navItem}>
                        <div className={`${styles.link} ${isActive('/browse-jobs') || isActive('/career-advice') ? styles.linkActive : ''}`}>
                            Find Work <span className={styles.chevron}>▼</span>
                        </div>
                        <div className={styles.dropdown}>
                            <Link href="/browse-jobs" className={`${styles.dropdownLink} ${pathname === '/browse-jobs' ? styles.dropdownLinkActive : ''}`}>Browse Jobs</Link>
                            <Link href="/job-seekers" className={`${styles.dropdownLink} ${pathname === '/job-seekers' ? styles.dropdownLinkActive : ''}`}>Candidate Benefits</Link>
                            <Link href="/career-advice" className={`${styles.dropdownLink} ${pathname === '/career-advice' ? styles.dropdownLinkActive : ''}`}>Career Advice</Link>
                        </div>
                    </div>

                    {/* For Employers */}
                    <div className={styles.navItem}>
                        <div className={`${styles.link} ${isActive('/employers') || isActive('/case-studies') ? styles.linkActive : ''}`}>
                            For Employers <span className={styles.chevron}>▼</span>
                        </div>
                        <div className={styles.dropdown}>
                            <Link href="/employers/post-job" className={`${styles.dropdownLink} ${pathname === '/employers/post-job' ? styles.dropdownLinkActive : ''}`}>Post a Job</Link>
                            <Link href="/employers/sourcing" className={`${styles.dropdownLink} ${pathname === '/employers/sourcing' ? styles.dropdownLinkActive : ''}`}>Talent Sourcing</Link>
                            {/* <Link href="/employers/products" className={`${styles.dropdownLink} ${pathname === '/employers/products' ? styles.dropdownLinkActive : ''}`}>Products & Pricing</Link> */}
                            {/* <Link href="/case-studies" className={`${styles.dropdownLink} ${pathname === '/case-studies' ? styles.dropdownLinkActive : ''}`}>Success Stories</Link> */}
                        </div>
                    </div>

                    {/* Company */}
                    <div className={styles.navItem}>
                        <div className={`${styles.link} ${isActive('/about') || isActive('/contact') || isActive('/careers') || isActive('/blog') || isActive('/podcast') ? styles.linkActive : ''}`}>
                            Company <span className={styles.chevron}>▼</span>
                        </div>
                        <div className={styles.dropdown}>
                            <Link href="/about" className={`${styles.dropdownLink} ${pathname === '/about' ? styles.dropdownLinkActive : ''}`}>About</Link>
                            <Link href="/contact" className={`${styles.dropdownLink} ${pathname === '/contact' ? styles.dropdownLinkActive : ''}`}>Contact</Link>
                            <Link href="/careers" className={`${styles.dropdownLink} ${pathname === '/careers' ? styles.dropdownLinkActive : ''}`}>Careers</Link>
                            <Link href="/blog" className={`${styles.dropdownLink} ${pathname === '/blog' ? styles.dropdownLinkActive : ''}`}>Blog</Link>
                            <Link href="/podcast" className={`${styles.dropdownLink} ${pathname === '/podcast' ? styles.dropdownLinkActive : ''}`}>Podcast</Link>
                        </div>
                    </div>

                    {/* Dashboard ── new dropdown
                    <div className={styles.navItem}>
                        <div className={styles.link}>
                            Dashboard <span className={styles.chevron}>▼</span>
                        </div>
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownSectionLabel}>Recruiter</div>
                            <Link href="/dashboard/company" className={styles.dropdownLink}>
                                <span className={styles.ddIcon}>🏢</span> Company Hub
                            </Link>
                            <div className={styles.dropdownDivider} />
                            <div className={styles.dropdownSectionLabel}>Candidate</div>
                            <Link href="/dashboard/candidate" className={styles.dropdownLink}>
                                <span className={styles.ddIcon}>👤</span> My Career
                            </Link>
                        </div>
                    </div> */}
                </div>

                {/* ── Auth Buttons ── */}
                <div className={styles.auth}>
                    <Link href="/login" className={styles.loginBtn}>Login</Link>
                    <Link href="/signup" className={styles.signupBtn}>Get Started</Link>
                </div>

                {/* ── Mobile Hamburger ── */}
                <button
                    className={`${styles.mobileToggle} ${isMenuOpen ? styles.open : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                >
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                </button>
            </div>

            {/* ── Mobile Drawer ── */}
            <div className={`${styles.mobileNav} ${isMenuOpen ? styles.open : ''}`} aria-hidden={!isMenuOpen}>

                <div className={styles.mobileNavItem}>
                    <span className={styles.mobileNavLabel}>Find Work</span>
                    <Link href="/browse-jobs" className={styles.mobileNavLink}>Browse Jobs</Link>
                    <Link href="/career-advice" className={styles.mobileNavLink}>Career Advice</Link>
                </div>

                <div className={styles.mobileNavItem}>
                    <span className={styles.mobileNavLabel}>For Employers</span>
                    <Link href="/employers/post-job" className={styles.mobileNavLink}>Post a Job</Link>
                    <Link href="/employers/sourcing" className={styles.mobileNavLink}>Talent Sourcing</Link>
                    <Link href="/employers/products" className={styles.mobileNavLink}>Products & Pricing</Link>
                    <Link href="/case-studies" className={styles.mobileNavLink}>Success Stories</Link>
                </div>

                <div className={styles.mobileNavItem}>
                    <span className={styles.mobileNavLabel}>Company</span>
                    <Link href="/about" className={styles.mobileNavLink}>About</Link>
                    <Link href="/contact" className={styles.mobileNavLink}>Contact</Link>
                    <Link href="/careers" className={styles.mobileNavLink}>Careers</Link>
                    <Link href="/blog" className={styles.mobileNavLink}>Blog</Link>
                    <Link href="/podcast" className={styles.mobileNavLink}>Podcast</Link>
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
