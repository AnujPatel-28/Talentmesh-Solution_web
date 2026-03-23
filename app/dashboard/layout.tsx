"use client";
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './dashboard-layout.module.css';

/* ─── SVG Icon Components ─── */
const Icons = {
    home: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    briefcase: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    clipboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
    ),
    messageSquare: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    barChart: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
        </svg>
    ),
    edit: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    calendar: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    pieChart: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
    ),
    settings: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
};

/* ─── Nav Definitions ─── */
interface NavItem { label: string; href: string; icon: React.ReactNode; badge?: number }

const CANDIDATE_NAV: NavItem[] = [
    { label: 'Home', href: '/dashboard/candidate', icon: Icons.home },
    { label: 'Jobs', href: '/dashboard/candidate/jobs', icon: Icons.briefcase },
    { label: 'Applications', href: '/dashboard/candidate/applications', icon: Icons.clipboard, badge: 5 },
    { label: 'Messages', href: '/dashboard/candidate/messages', icon: Icons.messageSquare, badge: 3 },
    { label: 'Analytics', href: '/dashboard/candidate/analytics', icon: Icons.barChart },
];

const RECRUITER_NAV: NavItem[] = [
    { label: 'Home', href: '/dashboard/recruiter', icon: Icons.home },
    { label: 'Job Postings', href: '/dashboard/recruiter/jobs', icon: Icons.edit, badge: 8 },
    { label: 'Candidates', href: '/dashboard/recruiter/candidates', icon: Icons.users, badge: 12 },
    { label: 'Interviews', href: '/dashboard/recruiter/interviews', icon: Icons.calendar, badge: 2 },
    { label: 'Reports', href: '/dashboard/recruiter/reports', icon: Icons.pieChart },
];

const SUPER_ADMIN_NAV: NavItem[] = [
    { label: 'Overview', href: '/dashboard/admin', icon: Icons.home },
    { label: 'Manage Jobs', href: '/dashboard/admin/jobs', icon: Icons.briefcase, badge: 14 },
    { label: 'Candidates', href: '/dashboard/admin/candidates', icon: Icons.users, badge: 23 },
    { label: 'Recruiters', href: '/dashboard/admin/recruiters', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, badge: 6 },
    { label: 'Blogs', href: '/dashboard/admin/blogs', icon: Icons.edit },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: Icons.pieChart },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user: authUser, isAdmin, signOut, isLoading } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
        } finally {
            setIsSigningOut(false);
        }
    };

    const isSuperAdmin = pathname.includes('/dashboard/admin');
    const isRecruiter = pathname.includes('/dashboard/recruiter');
    const roleId = authUser?.role_id || '';

    const getDynamicNav = (items: NavItem[], base: string) => {
        return items.map(item => ({
            ...item,
            href: item.href.replace(base, `${base}/${roleId}`)
        }));
    };

    const navItems = isSuperAdmin 
        ? getDynamicNav(SUPER_ADMIN_NAV, '/dashboard/admin') 
        : isRecruiter 
            ? getDynamicNav(RECRUITER_NAV, '/dashboard/recruiter') 
            : getDynamicNav(CANDIDATE_NAV, '/dashboard/candidate');

    const user = {
        name: authUser?.name || authUser?.email?.split('@')[0] || 'User',
        initials: (authUser?.name?.split(' ').map(n => n[0]).join('') || 'U').toUpperCase(),
        email: authUser?.email || ''
    };

    const pageTitle = (() => {
        const seg = pathname.split('/').pop();
        if (seg === roleId || seg === 'candidate' || seg === 'recruiter' || seg === 'admin') return 'Dashboard';
        return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : 'Dashboard';
    })();

    const handleToggle = useCallback(() => {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setMobileOpen(prev => !prev);
        } else {
            setCollapsed(prev => !prev);
        }
    }, []);

    React.useEffect(() => {
        if (!isLoading && !authUser) {
            router.push('/login');
        }
    }, [isLoading, authUser, router]);

    if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#007BFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>;

    if (!authUser) {
        return null;
    }

    // NEW: Allow dedicated branches to fully control their own shell
    const isAdminBranch = pathname.startsWith('/dashboard/admin');
    const isRecruiterBranch = pathname.startsWith('/dashboard/recruiter');

    if (isAdminBranch || isRecruiterBranch) {
        return <>{children}</>;
    }

    return (
        <div className={styles.shell}>
            {isAdmin && <div className={styles.adminAccent} />}
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''} ${mobileOpen ? styles.sidebarMobileOpen : ''}`}>
                <div className={`${styles.sidebarHead} ${isAdmin ? styles.adminSidebarHead : ''}`}>
                    <Link href="/" className={styles.brand}>
                        {collapsed ? (
                            <span className={styles.brandIcon}>
                                <Image src="/TalentMesh_Logo-removebg-preview.png" alt="Icon" width={32} height={32} unoptimized />
                            </span>
                        ) : (
                            isAdmin ? (
                                <div className={styles.adminPortalHeader}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                    <span style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Admin Portal</span>
                                </div>
                            ) : (
                                <Image src="/TalentMesh_page-0002-removebg-preview.png" alt="TalentMesh" width={140} height={38} style={{ objectFit: 'contain' }} unoptimized />
                            )
                        )}
                    </Link>
                </div>

                <nav className={styles.nav}>
                    {navItems.map(item => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? item.label : undefined}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                                {item.badge != null && !collapsed && (
                                    <span className={styles.navBadge}>{item.badge}</span>
                                )}
                                {item.badge != null && collapsed && (
                                    <span className={styles.navBadgeDot} />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.sidebarFoot}>
                    <Link
                        href={isSuperAdmin ? `/dashboard/admin/${roleId}/settings` : isRecruiter ? `/dashboard/recruiter/${roleId}/settings` : `/dashboard/candidate/${roleId}/settings`}
                        className={styles.navLink}
                        onClick={() => setMobileOpen(false)}
                    >
                        <span className={styles.navIcon}>{Icons.settings}</span>
                        {!collapsed && <span className={styles.navLabel}>Settings</span>}
                    </Link>
                    
                    {!isAdmin && (
                        <button onClick={handleSignOut} disabled={isSigningOut} className={`${styles.navLink} ${styles.logoutBtn}`}>
                            <span className={styles.navIcon}>
                                {isSigningOut ? (
                                    <div className={styles.spinnerSmall} />
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                )}
                            </span>
                            {!collapsed && <span className={styles.navLabel}>{isSigningOut ? 'Signing out...' : 'Logout'}</span>}
                        </button>
                    )}

                    {isAdmin ? (
                        <div className={styles.adminMiniCard}>
                             {!collapsed && (
                                <div className={styles.adminMiniCardInner}>
                                   <div className={`${styles.userAvatar} ${styles.adminAvatar}`}>{user.initials}</div>
                                   <div className={styles.userMeta}>
                                       <span className={styles.userName}>{user.name}</span>
                                       <span className={styles.userEmail}>{user.email}</span>
                                   </div>
                                   <div className={styles.lockIcon}>
                                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                   </div>
                                </div>
                             )}
                             <button 
                                onClick={handleSignOut} 
                                disabled={isSigningOut} 
                                className={styles.adminSignOutBtn}
                                style={{ display: collapsed ? 'flex' : 'block', justifyContent: 'center' }}
                             >
                                {isSigningOut ? '...' : collapsed ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg> : 'Sign Out'}
                             </button>
                        </div>
                    ) : (
                        <div className={styles.userCard}>
                            <div className={styles.userAvatar}>{user.initials}</div>
                            {!collapsed && (
                                <div className={styles.userMeta}>
                                    <span className={styles.userName}>{user.name}</span>
                                    <span className={styles.userEmail}>{user.email}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

            {/* Main */}
            <div className={styles.main}>
                <header className={styles.topbar}>
                    <button className={styles.hamburger} onClick={handleToggle} aria-label="Toggle sidebar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <h1 className={styles.pageTitle}>{pageTitle}</h1>
                    <div className={styles.topRight}>
                        {isAdmin && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{user.name}</span>
                                    <span className={styles.adminBadge}>Admin</span>
                                </div>
                                <button 
                                    onClick={handleSignOut} 
                                    disabled={isSigningOut} 
                                    className={`${styles.topSignOut} ${isAdmin ? styles.topSignOutAdmin : ''}`}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                                </button>
                            </div>
                        )}
                        <div className={styles.searchBox}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            <input className={styles.searchInput} placeholder="Search jobs, skills..." />
                        </div>
                        <button className={styles.notifBtn} aria-label="Notifications">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                            <span className={styles.notifDot} />
                        </button>
                        <div className={`${styles.topAvatar} ${isAdmin ? styles.adminAvatar : ''}`}>{user.initials}</div>
                    </div>
                </header>
                <div className={styles.content}>{children}</div>
            </div>
        </div>
    );
}
