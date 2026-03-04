"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './dashboard-layout.module.css';

/* ─── Inline SVG Icons ─── */
const IconGrid = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const IconBriefcase = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>;
const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconBarChart = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconSettings = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const IconBell = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IconMenu = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconX = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

/* ─── Nav Items ─── */
interface NavItem { label: string; href: string; icon: React.ReactNode; badge?: number }

const CANDIDATE_NAV: NavItem[] = [
    { label: 'Overview', href: '/dashboard/candidate', icon: <IconGrid /> },
    { label: 'Applications', href: '/dashboard/candidate/applications', icon: <IconBriefcase />, badge: 3 },
    { label: 'Job Search', href: '/dashboard/candidate/jobs', icon: <IconSearch /> },
    { label: 'Interviews', href: '/dashboard/candidate/interviews', icon: <IconCalendar />, badge: 1 },
    { label: 'Insights', href: '/dashboard/candidate/insights', icon: <IconBarChart /> },
    { label: 'Profile', href: '/dashboard/candidate/profile', icon: <IconUser /> },
    { label: 'Settings', href: '/dashboard/candidate/settings', icon: <IconSettings /> },
];

const RECRUITER_NAV: NavItem[] = [
    { label: 'Overview', href: '/dashboard/recruiter', icon: <IconGrid /> },
    { label: 'Job Postings', href: '/dashboard/recruiter/jobs', icon: <IconBriefcase />, badge: 5 },
    { label: 'Candidates', href: '/dashboard/recruiter/candidates', icon: <IconUsers />, badge: 12 },
    { label: 'Interviews', href: '/dashboard/recruiter/interviews', icon: <IconCalendar />, badge: 2 },
    { label: 'Analytics', href: '/dashboard/recruiter/analytics', icon: <IconBarChart /> },
    { label: 'Company Profile', href: '/dashboard/recruiter/profile', icon: <IconUser /> },
    { label: 'Settings', href: '/dashboard/recruiter/settings', icon: <IconSettings /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isRecruiter = pathname.startsWith('/dashboard/recruiter') || pathname.startsWith('/dashboard/company');
    const navItems = isRecruiter ? RECRUITER_NAV : CANDIDATE_NAV;
    const user = isRecruiter
        ? { name: 'Harper Reid', initials: 'HR', role: 'Lead Recruiter', company: 'TechCorp' }
        : { name: 'Raj Mehta', initials: 'RM', role: 'Frontend Engineer', company: '' };

    /* Profile completion mock — would come from API */
    const profileCompletion = 35;

    return (
        <div className={`${styles.shell} ${isRecruiter ? styles.recruiterTheme : ''}`}>
            {/* ── Sidebar ── */}
            <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarTop}>
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoMark}>TM</span>
                        <span className={styles.logoText}>TalentMesh</span>
                    </Link>
                    <button className={styles.closeMobile} onClick={() => setMobileOpen(false)} aria-label="Close">
                        <IconX />
                    </button>
                </div>

                <nav className={styles.nav}>
                    <span className={styles.navSection}>
                        {isRecruiter ? 'Recruiting' : 'Job Search'}
                    </span>
                    {navItems.map(item => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span className={styles.navLabel}>{item.label}</span>
                                {item.badge != null && (
                                    <span className={styles.navBadge}>{item.badge}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile completion nudge */}
                {profileCompletion < 50 && (
                    <div className={styles.profileNudge}>
                        <div className={styles.nudgeHeader}>
                            <span className={styles.nudgeTitle}>Complete Profile</span>
                            <span className={styles.nudgePercent}>{profileCompletion}%</span>
                        </div>
                        <div className={styles.nudgeBar}>
                            <div className={styles.nudgeFill} style={{ width: `${profileCompletion}%` }} />
                        </div>
                        <p className={styles.nudgeText}>Reach 50% to unlock all features</p>
                    </div>
                )}

                <div className={styles.userCard}>
                    <div className={styles.userAvatar}>{user.initials}</div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userRole}>{user.role}</span>
                    </div>
                    <Link href="/login" className={styles.logoutBtn} aria-label="Logout">
                        <IconLogout />
                    </Link>
                </div>
            </aside>

            {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

            {/* ── Main ── */}
            <div className={styles.main}>
                <header className={styles.topbar}>
                    <button className={styles.hamburger} onClick={() => setMobileOpen(true)} aria-label="Menu">
                        <IconMenu />
                    </button>
                    <div className={styles.topbarSearch}>
                        <IconSearch />
                        <input type="search" placeholder="Search..." className={styles.searchInput} />
                    </div>
                    <div className={styles.topbarRight}>
                        <button className={styles.notifBtn} aria-label="Notifications">
                            <IconBell />
                            <span className={styles.notifDot} />
                        </button>
                        <div className={styles.topbarAvatar}>{user.initials}</div>
                    </div>
                </header>

                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}
