'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './dashboard-layout.module.css';

const IconBriefcase = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconBarChart = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
const IconGrid = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const IconSettings = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const IconBell = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
const IconSparkle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m12 3 1.912 5.885L20 10.8l-5.088 1.912L13 18.6l-1.912-5.888L6 10.8l5.088-1.915L12 3Z" /></svg>;
const IconMenu = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconX = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconChevronRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>;

// ─── Nav definitions ──────────────────────────────────────────────────────────

interface NavItem { label: string; href: string; icon: React.ReactNode; badge?: number }

const COMPANY_NAV: NavItem[] = [
    { label: 'Overview', href: '/dashboard/company', icon: <IconGrid /> },
    { label: 'Job Postings', href: '/dashboard/company/jobs', icon: <IconBriefcase />, badge: 2 },
    { label: 'Candidates', href: '/dashboard/company/candidates', icon: <IconUsers />, badge: 7 },
    { label: 'Interviews', href: '/dashboard/company/interviews', icon: <IconCalendar /> },
    { label: 'Analytics', href: '/dashboard/company/analytics', icon: <IconBarChart /> },
    { label: 'Settings', href: '/dashboard/company/settings', icon: <IconSettings /> },
];

const CANDIDATE_NAV: NavItem[] = [
    { label: 'Overview', href: '/dashboard/candidate', icon: <IconGrid /> },
    { label: 'My Applications', href: '/dashboard/candidate/applications', icon: <IconBriefcase />, badge: 3 },
    { label: 'Job Discovery', href: '/dashboard/candidate/jobs', icon: <IconSearch /> },
    { label: 'Interviews', href: '/dashboard/candidate/interviews', icon: <IconCalendar />, badge: 3 },
    { label: 'Career Insights', href: '/dashboard/candidate/insights', icon: <IconBarChart /> },
    { label: 'Settings', href: '/dashboard/candidate/settings', icon: <IconSettings /> },
];

// ─── Layout Component ─────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isCompany = pathname.startsWith('/dashboard/company') || pathname === '/dashboard';
    const isCandidate = pathname.startsWith('/dashboard/candidate');

    const role = isCandidate ? 'candidate' : 'company';
    const navItems = isCandidate ? CANDIDATE_NAV : COMPANY_NAV;

    const user = isCandidate
        ? { name: 'Raj Mehta', initials: 'RM', role: 'Frontend Engineer' }
        : { name: 'Harper Reid', initials: 'HR', role: 'Lead Recruiter' };

    return (
        <div className={styles.shell}>
            {/* ── Sidebar ── */}
            <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
                {/* Logo */}
                <div className={styles.sidebarLogo}>
                    <Link href="/" className={styles.logoLink}>
                        <div className={styles.logoMark}>TM</div>
                        <span className={styles.logoText}>TalentMesh</span>
                    </Link>
                    <button className={styles.closeMobile} onClick={() => setMobileOpen(false)} aria-label="Close menu"><IconX /></button>
                </div>

                {/* Role Switcher */}
                <div className={styles.roleSwitcher}>
                    <Link
                        href="/dashboard/company"
                        className={`${styles.roleBtn} ${role === 'company' ? styles.roleBtnActive : ''}`}
                        onClick={() => setMobileOpen(false)}
                    >
                        🏢 Company
                    </Link>
                    <Link
                        href="/dashboard/candidate"
                        className={`${styles.roleBtn} ${role === 'candidate' ? styles.roleBtnActive : ''}`}
                        onClick={() => setMobileOpen(false)}
                    >
                        👤 Candidate
                    </Link>
                </div>

                {/* Search */}
                <div className={styles.sidebarSearch}>
                    <IconSearch />
                    <input type="search" placeholder="Search..." className={styles.searchInput} aria-label="Search dashboard" />
                </div>

                {/* Nav */}
                <nav className={styles.nav} aria-label="Dashboard navigation">
                    {navItems.map(item => {
                        const active = pathname === item.href || (item.href !== '/dashboard/company' && item.href !== '/dashboard/candidate' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                                onClick={() => setMobileOpen(false)}
                                aria-current={active ? 'page' : undefined}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span className={styles.navLabel}>{item.label}</span>
                                {item.badge != null && (
                                    <span className={styles.navBadge} aria-label={`${item.badge} new`}>{item.badge}</span>
                                )}
                                {active && <span className={styles.navArrow}><IconChevronRight /></span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* AI Status */}
                <div className={styles.aiStatus}>
                    <div className={styles.aiDot} />
                    <div>
                        <div className={styles.aiLabel}><IconSparkle /> AI Engine Active</div>
                        <div className={styles.aiSub}>Models: GPT-4o · Aura v3</div>
                    </div>
                </div>

                {/* User */}
                <div className={styles.userCard}>
                    <div className={styles.userAvatar}>{user.initials}</div>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userRole}>{user.role}</div>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />}

            {/* ── Main Area ── */}
            <div className={styles.mainWrap}>
                {/* Top bar */}
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <button className={styles.hamburger} onClick={() => setMobileOpen(true)} aria-label="Open menu">
                            <IconMenu />
                        </button>
                        <div className={styles.breadcrumb}>
                            <span>Dashboard</span>
                            <IconChevronRight />
                            <span className={styles.breadcrumbActive}>{isCandidate ? 'Candidate' : 'Company'}</span>
                        </div>
                    </div>
                    <div className={styles.topbarRight}>
                        <div className={styles.aiPill}><IconSparkle /> AI Active</div>
                        <button className={styles.notifBtn} aria-label="Notifications">
                            <IconBell />
                            <span className={styles.notifDot} aria-hidden="true" />
                        </button>
                        <div className={styles.topbarAvatar} title={user.name}>{user.initials}</div>
                    </div>
                </header>

                {/* Page content */}
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}
