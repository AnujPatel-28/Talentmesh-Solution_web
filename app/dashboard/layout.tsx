"use client";
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSearch, SearchProvider } from '@/context/SearchContext';
import { insforge } from '@/lib/insforge';
import SearchOverlay from '@/components/candidate/SearchOverlay';
import CenteredLoader from '@/components/ui/CenteredLoader';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';
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
    recruiter: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
        </svg>
    ),
    bookOpen: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    ),
    activity: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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

const getCandidateNav = (role_id: string): NavItem[] => [
    { label: 'Home', href: `/dashboard/candidate/${role_id}`, icon: Icons.home },
    { label: 'Jobs', href: `/dashboard/candidate/${role_id}/jobs`, icon: Icons.briefcase },
    { label: 'Applications', href: `/dashboard/candidate/${role_id}/applications`, icon: Icons.clipboard, badge: 5 },
    { label: 'Messages', href: `/dashboard/candidate/${role_id}/messages`, icon: Icons.messageSquare, badge: 3 },
    { label: 'Analytics', href: `/dashboard/candidate/${role_id}/analytics`, icon: Icons.barChart },
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
    { label: 'Recruiters', href: '/dashboard/admin/recruiters', icon: Icons.recruiter, badge: 6 },
    { label: 'Blogs', href: '/dashboard/admin/blogs', icon: Icons.bookOpen },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: Icons.pieChart },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SearchProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </SearchProvider>
    );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user: authUser, isAdmin, signOut, isLoading } = useAuth();
    const { openSearch } = useSearch();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [adminCounts, setAdminCounts] = useState({ jobs: 0, candidates: 0, recruiters: 0 });
    const [notifCount, setNotifCount] = useState(0);

    React.useEffect(() => {
        if (isAdmin) {
            const fetchCounts = async () => {
                try {
                    const [reportsRes, alertsRes] = await Promise.all([
                        fetch('/api/admin/reports'),
                        fetch('/api/admin/alerts')
                    ]);
                    if (reportsRes.ok) {
                        const data = await reportsRes.json();
                        setAdminCounts({
                            jobs: data.metrics?.totalJobs || 0,
                            candidates: data.metrics?.totalCandidates || 0,
                            recruiters: data.metrics?.totalRecruiters || 0
                        });
                    }
                    if (alertsRes.ok) {
                        const alerts = await alertsRes.json();
                        setNotifCount((alerts.pendingRecruiters || 0) + (alerts.pendingJobs || 0) + (alerts.reportedJobs || 0));
                    }
                } catch (err) {
                    console.error(err);
                }
            };
            fetchCounts();
            const interval = setInterval(fetchCounts, 60000);
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

    // Setup realtime live notifications
    React.useEffect(() => {
        if (!authUser) return;

        let active = true;
        const setupRealtime = async () => {
            try {
                await insforge.realtime.connect();
                
                if (isAdmin) {
                    await insforge.realtime.subscribe('admin:alerts');
                    insforge.realtime.on('new_alert', () => {
                        if (active) setNotifCount(prev => prev + 1);
                    });
                } else if (authUser?.id) {
                    await insforge.realtime.subscribe(`user:${authUser.id}`);
                    insforge.realtime.on('new_notification', () => {
                        if (active) setNotifCount(prev => prev + 1);
                    });
                }
            } catch (err) {
                console.error('Failed to setup realtime notifications:', err);
            }
        };

        setupRealtime();

        return () => {
            active = false;
        };
    }, [isAdmin, authUser]);

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
    
    // Extract ID from path if authUser is not yet loaded to show correct sidebar
    const pathSegments = pathname.split('/');
    const roleIdFromPath = pathSegments.find(s => 
        s.length === 36 || /^(cand|rec|adm)_[a-z0-9]+$/i.test(s)
    ) || '';
    
    const roleId = authUser?.id || roleIdFromPath;
    const navItems = isSuperAdmin ? [
        { label: 'Overview', href: '/dashboard/admin', icon: Icons.home },
        { label: 'Manage Jobs', href: '/dashboard/admin/jobs', icon: Icons.briefcase, badge: adminCounts.jobs > 0 ? adminCounts.jobs : undefined },
        { label: 'Candidates', href: '/dashboard/admin/candidates', icon: Icons.users, badge: adminCounts.candidates > 0 ? adminCounts.candidates : undefined },
        { label: 'Recruiters', href: '/dashboard/admin/recruiters', icon: Icons.recruiter, badge: adminCounts.recruiters > 0 ? adminCounts.recruiters : undefined },
        { label: 'Blogs', href: '/dashboard/admin/blogs', icon: Icons.bookOpen },
        { label: 'Reports', href: '/dashboard/admin/reports', icon: Icons.pieChart },
    ] : isRecruiter ? RECRUITER_NAV : getCandidateNav(roleId);

    const user = {
        name: authUser?.name || authUser?.email?.split('@')[0] || 'User',
        initials: (authUser?.name?.split(' ').map(n => n[0]).join('') || 'U').toUpperCase(),
        email: authUser?.email || ''
    };

    const pageTitle = (() => {
        const segments = pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        
        // Helper to check for UUIDs or custom IDs (like cand_...)
        const isID = (str: string) => {
            if (!str) return false;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const customIdRegex = /^(cand|rec|adm)_[a-z0-9]+$/i;
            return uuidRegex.test(str) || customIdRegex.test(str);
        };

        if (!last || isID(last)) {
            const prev = segments[segments.length - 2];
            // If on the base dashboard path, show the user's name or a clean "Dashboard"
            if (!prev || prev === 'candidate' || prev === 'recruiter' || prev === 'admin') {
                return user.name || 'Dashboard';
            }
            return prev.charAt(0).toUpperCase() + prev.slice(1);
        }

        if (last === 'candidate' || last === 'recruiter' || last === 'admin') return 'Dashboard';
        return last.charAt(0).toUpperCase() + last.slice(1);
    })();

    const handleToggle = useCallback(() => {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setMobileOpen(prev => !prev);
        } else {
            setCollapsed(prev => !prev);
        }
    }, []);

    React.useEffect(() => {
        const isDedicatedBranch = pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/recruiter');

        if (!isDedicatedBranch && !isLoading && !authUser) {
            router.push('/login');
        }
    }, [isLoading, authUser, router, pathname]);

    const isRecruiterBranch = pathname.startsWith('/dashboard/recruiter');

    if (isRecruiterBranch) {
        return <>{children}</>;
    }

    // Shell rendering logic
    const renderContent = () => {
        if (isLoading) {
            return <HomeSkeleton />;
        }
        if (!authUser) {
            return null; // Will redirect via useEffect
        }
        return children;
    };

    const homeUrl = isSuperAdmin ? '/dashboard/admin' : isRecruiter ? '/dashboard/recruiter' : authUser ? `/dashboard/candidate/${roleId}` : '/';

    return (
        <div className={styles.shell}>
            <SearchOverlay />
            {isAdmin && <div className={styles.adminAccent} />}
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''} ${mobileOpen ? styles.sidebarMobileOpen : ''}`}>
                <div className={`${styles.sidebarHead} ${isAdmin ? styles.adminSidebarHead : ''}`}>
                    <Link href={homeUrl} className={styles.brand}>
                        {collapsed ? (
                            <span className={styles.brandIcon}>
                                <Image src="/TalentMesh_Logo-removebg-preview.png" alt="Icon" width={32} height={32} unoptimized />
                            </span>
                        ) : (
                            <Image src="/TalentMesh_page-0002-removebg-preview.png" alt="TalentMesh" width={140} height={38} style={{ objectFit: 'contain' }} unoptimized />
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
                    {isAdmin && !collapsed && (
                        <div className={styles.adminPortalHeader} style={{ marginBottom: '12px', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span style={{ fontSize: '0.9rem', letterSpacing: '-0.01em' }}>Admin Portal</span>
                        </div>
                    )}
                    <Link
                        href={isSuperAdmin ? '/dashboard/admin/settings' : isRecruiter ? '/dashboard/recruiter/settings' : `/dashboard/candidate/${roleId}/settings`}
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
                        <div className={styles.searchBox} onClick={openSearch} style={{ cursor: 'pointer' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem', userSelect: 'none' }}>Search jobs, skills...</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button className={styles.notifBtn} aria-label="Notifications" onClick={() => {
                                setIsNotifOpen(!isNotifOpen);
                                if (!isNotifOpen) {
                                    setNotifCount(0);
                                }
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                {notifCount > 0 ? (
                                    <span className={styles.notifBadge}>{notifCount > 99 ? '99+' : notifCount}</span>
                                ) : (
                                    <span className={styles.notifDot} />
                                )}
                            </button>
                            {isNotifOpen && (
                                <div className={styles.notifDropdown}>
                                    <div className={styles.notifHeader}>Notifications</div>
                                    <div className={styles.notifBody}>
                                        {notifCount > 0 ? (
                                            <div className={styles.notifItem}>You have <strong>{notifCount}</strong> new alerts requiring attention.</div>
                                        ) : (
                                            <div className={styles.notifItem}>No new notifications. You're all caught up!</div>
                                        )}
                                    </div>
                                    <Link 
                                        href={isSuperAdmin ? '/dashboard/admin/notifications' : isRecruiter ? '/dashboard/recruiter/notifications' : `/dashboard/candidate/${roleId}/notifications`} 
                                        className={styles.notifFooter} 
                                        onClick={() => setIsNotifOpen(false)}
                                    >
                                        View all notifications
                                    </Link>
                                </div>
                            )}
                        </div>
                        <Link 
                            href={isSuperAdmin ? '/dashboard/admin/settings' : isRecruiter ? '/dashboard/recruiter/settings' : `/dashboard/candidate/${roleId}/profile`}
                            className={`${styles.topAvatar} ${isAdmin ? styles.adminAvatar : ''}`}
                        >
                            {user.initials}
                        </Link>
                    </div>
                </header>
                <main className={styles.content}>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
