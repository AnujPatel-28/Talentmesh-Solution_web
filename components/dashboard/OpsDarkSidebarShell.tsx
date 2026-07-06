"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';
import { toast } from 'react-hot-toast';
import styles from './OpsDarkSidebarShell.module.css';

/* ─── SVG Icons ─── */
const Icons = {
    home: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    creditCard: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    ),
    megaphone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    jobs: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    sourcing: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    candidates: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    interviews: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    analytics: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
    ),
    tools: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    chevronRight: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    chevronDown: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    close: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    plus: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    ),
    externalLink: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
    ),
    help: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    ),
    bell: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    mail: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    menu: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
        </svg>
    )
};

interface FlyoutChild {
    label: string;
    href: string;
    isExternal?: boolean;
}

interface OpsNavItem {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    children?: FlyoutChild[];
}

export default function OpsDarkSidebarShell({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isCreateNewOpen, setIsCreateNewOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (id: string) => {
        setOpenGroups(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const accountRef = useRef<HTMLDivElement>(null);
    const createNewRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const roleId = useMemo(() => {
        const parts = pathname.split('/');
        const recIndex = parts.indexOf('recruiter');
        if (recIndex !== -1 && parts[recIndex + 1]) {
            return parts[recIndex + 1];
        }
        return user?.role_id || '';
    }, [pathname, user?.role_id]);

    const isRecruiterRoute = pathname.startsWith('/dashboard/recruiter/');

    // Recruiter Nav Definitions (Consolidated into 6 categories)
    const recruiterNav = useMemo<OpsNavItem[]>(() => [
        {
            id: 'jobs',
            label: 'Jobs',
            href: `/dashboard/recruiter/${roleId}/jobs`,
            icon: Icons.jobs,
            children: [
                { label: 'All Job Postings', href: `/dashboard/recruiter/${roleId}/jobs` },
                { label: 'Post a New Job', href: `/dashboard/recruiter/${roleId}/jobs/post-job` },
                { label: 'Draft Jobs', href: `/dashboard/recruiter/${roleId}/jobs?tab=drafts` },
                { label: 'Published Jobs', href: `/dashboard/recruiter/${roleId}/jobs?tab=published` },
                { label: 'Expired Jobs', href: `/dashboard/recruiter/${roleId}/jobs?tab=expired` },
                { label: 'Job Templates', href: `/dashboard/recruiter/${roleId}/jobs/templates` },
            ]
        },
        {
            id: 'sourcing',
            label: 'Smart Sourcing',
            href: `/dashboard/recruiter/${roleId}/sourcing`,
            icon: Icons.sourcing,
            children: [
                { label: 'Sourcing Overview', href: `/dashboard/recruiter/${roleId}/sourcing` },
                { label: 'Search Candidates', href: `/dashboard/recruiter/${roleId}/sourcing/search` }
            ]
        },
        {
            id: 'candidates',
            label: 'Candidates',
            href: `/dashboard/recruiter/${roleId}/candidates`,
            icon: Icons.candidates,
            children: [
                { label: 'Candidates Database', href: `/dashboard/recruiter/${roleId}/candidates` },
                { label: 'Shortlisted Candidates', href: `/dashboard/recruiter/${roleId}/candidates?tab=shortlisted` },
                { label: 'On Hold Candidates', href: `/dashboard/recruiter/${roleId}/candidates?tab=on_hold` },
                { label: 'Saved Candidates', href: `/dashboard/recruiter/${roleId}/candidates?tab=saved` },
                { label: 'Hiring Pipeline', href: `/dashboard/recruiter/${roleId}/pipeline` },
                { label: 'NVite Inbox', href: `/dashboard/recruiter/${roleId}/nvite` },
            ]
        },
        {
            id: 'interviews',
            label: 'Interviews',
            href: `/dashboard/recruiter/${roleId}/interviews`,
            icon: Icons.interviews,
            children: [
                { label: 'Scheduled Interviews', href: `/dashboard/recruiter/${roleId}/interviews` },
                { label: 'Offers Manager', href: `/dashboard/recruiter/${roleId}/offers` }
            ]
        },
        {
            id: 'analytics',
            label: 'Analytics',
            href: `/dashboard/recruiter/${roleId}/reports`,
            icon: Icons.analytics,
            children: [
                { label: 'Analytics Dashboard', href: `/dashboard/recruiter/${roleId}/reports` },
                { label: 'Spend Snapshot', href: `/dashboard/recruiter/${roleId}/reports?tab=spend` }
            ]
        },
        {
            id: 'tools',
            label: 'Tools',
            href: `/dashboard/recruiter/${roleId}/messages`,
            icon: Icons.tools,
            children: [
                { label: 'Messages Inbox', href: `/dashboard/recruiter/${roleId}/messages` },
                { label: 'System Notifications', href: `/dashboard/recruiter/${roleId}/notifications` },
                { label: 'Settings', href: `/dashboard/recruiter/${roleId}/settings` },
                { label: 'TalentMesh Main Site', href: '/', isExternal: true }
            ]
        }
    ], [roleId]);

    // Admin Nav Definitions (Organized into flyout sub-options)
    const adminNav = useMemo<OpsNavItem[]>(() => [
        {
            id: 'overview',
            label: 'Overview',
            href: '/dashboard/admin',
            icon: Icons.home,
        },
        {
            id: 'jobs',
            label: 'Jobs & Applications',
            href: '/dashboard/admin/jobs',
            icon: Icons.jobs,
            children: [
                { label: 'All Job Postings', href: '/dashboard/admin/jobs' },
                { label: 'Job Approvals', href: '/dashboard/admin/job-approvals' },
                { label: 'Job Applications', href: '/dashboard/admin/applications' }
            ]
        },
        {
            id: 'candidates',
            label: 'Users & Companies',
            href: '/dashboard/admin/candidates',
            icon: Icons.candidates,
            children: [
                { label: 'Candidates Directory', href: '/dashboard/admin/candidates' },
                { label: 'Recruiters Directory', href: '/dashboard/admin/recruiters' },
                { label: 'Companies Directory', href: '/dashboard/admin/companies' }
            ]
        },
        {
            id: 'content',
            label: 'Content Management',
            href: '/dashboard/admin/announcements',
            icon: Icons.megaphone,
            children: [
                { label: 'Announcements Manager', href: '/dashboard/admin/announcements' },
                { label: 'Blog Posts', href: '/dashboard/admin/blogs' },
                { label: 'Email Templates', href: '/dashboard/admin/email-templates' }
            ]
        },
        {
            id: 'billing',
            label: 'Billing & Plans',
            href: '/dashboard/admin/plans',
            icon: Icons.creditCard,
            children: [
                { label: 'Subscription Plans', href: '/dashboard/admin/plans' },
                { label: 'Billing & Invoices', href: '/dashboard/admin/billing' }
            ]
        },
        {
            id: 'tools',
            label: 'System & Audit',
            href: '/dashboard/admin/audit-logs',
            icon: Icons.tools,
            children: [
                { label: 'Audit Logs', href: '/dashboard/admin/audit-logs' },
                { label: 'System Settings', href: '/dashboard/admin/settings' }
            ]
        },
        {
            id: 'messages',
            label: 'Messages',
            href: `/dashboard/admin/${roleId || 'me'}/messages`,
            icon: Icons.mail,
        }
    ], [roleId]);

    const navItems = isRecruiterRoute ? recruiterNav : adminNav;

    // Auto-open active group on page navigation
    useEffect(() => {
        const activeIds = new Set<string>();
        navItems.forEach(item => {
            if (item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))) {
                activeIds.add(item.id);
            }
        });
        if (activeIds.size > 0) {
            setOpenGroups(prev => new Set([...prev, ...activeIds]));
        }
    }, [pathname, navItems]);

    // Load unread notifications dot
    useEffect(() => {
        if (!user?.id) return;
        insforge.database
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_read', false)
            .then(({ data }) => {
                setNotifCount(data ? data.length : 0);
            });
    }, [user?.id]);

    // Handle outside clicks
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setIsAccountOpen(false);
            }
            if (createNewRef.current && !createNewRef.current.contains(event.target as Node)) {
                setIsCreateNewOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            await signOut();
            router.push('/login');
            toast.success('Signed out successfully');
        } catch (err) {
            console.error('Sign out error:', err);
            toast.error('Failed to sign out');
        } finally {
            setIsSigningOut(false);
        }
    };

    const userInitials = useMemo(() => {
        if (user?.name) {
            return user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        }
        return 'OP';
    }, [user?.name]);

    return (
        <div className={styles.shell}>
            {/* Sidebar drawer backdrop (mobile) */}
            {isMobileOpen && (
                <div className={styles.backdrop} onClick={() => setIsMobileOpen(false)} />
            )}

            {/* Sidebar container */}
            <aside className={`
                ${styles.sidebar} 
                ${isCollapsed ? styles.sidebarCollapsed : ''} 
                ${isMobileOpen ? styles.sidebarMobileOpen : ''}
            `}>
                {/* Top Header Row with Logo & Collapse Toggle */}
                <div className={styles.brandRow}>
                    {!isCollapsed && (
                        <Link href={isRecruiterRoute ? `/dashboard/recruiter/${roleId}` : '/dashboard/admin'} style={{ display: 'flex', alignItems: 'center' }}>
                            <Image 
                                src="/TalentMesh_page-0002-removebg-preview.png" 
                                alt="TalentMesh Logo" 
                                width={32} 
                                height={32} 
                                unoptimized 
                            />
                        </Link>
                    )}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)} 
                        className={styles.collapseBtnTop}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-label="Toggle sidebar"
                    >
                        <svg 
                            width="18" 
                            height="18" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            style={{ 
                                transform: isCollapsed ? 'rotate(180deg)' : 'none', 
                                transition: 'transform 0.2s ease' 
                            }}
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                </div>

                {/* Create New Pill/Button (below collapse row with gap) */}
                <div className={styles.createWrapper} ref={createNewRef}>
                    <button 
                        onClick={() => setIsCreateNewOpen(!isCreateNewOpen)}
                        className={`
                            ${styles.createBtn} 
                            ${isCollapsed ? styles.createBtnCollapsed : ''}
                        `}
                    >
                        {Icons.plus}
                        {!isCollapsed && (
                            <>
                                <span style={{ flex: 1, textAlign: 'left', marginLeft: '8px' }}>Create new</span>
                                {Icons.chevronDown}
                            </>
                        )}
                    </button>

                    {/* Create New Submenu */}
                    {isCreateNewOpen && (
                        <div className={styles.createDropdown} style={{ left: isCollapsed ? '72px' : '16px' }}>
                            <Link href={isRecruiterRoute ? `/dashboard/recruiter/${roleId}/jobs/post-job` : '/dashboard/admin/jobs'} className={styles.createDropdownItem} onClick={() => setIsCreateNewOpen(false)}>
                                Post a Job
                            </Link>
                            {isRecruiterRoute && (
                                <>
                                    <Link href={`/dashboard/recruiter/${roleId}/nvite`} className={styles.createDropdownItem} onClick={() => setIsCreateNewOpen(false)}>
                                        Send NVite
                                    </Link>
                                    <Link href={`/dashboard/recruiter/${roleId}/interviews`} className={styles.createDropdownItem} onClick={() => setIsCreateNewOpen(false)}>
                                        Schedule Interview
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Nav Items List */}
                <nav className={styles.nav}>
                    {navItems.map((item: OpsNavItem) => {
                        const hasChildren = item.children && item.children.length > 0;
                        const isOpen = openGroups.has(item.id);
                        const isChildActive = item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/'));
                        const isLinkActive = pathname === item.href || isChildActive;
                        const isHovered = hoveredItem === item.id;

                        if (hasChildren && !isCollapsed) {
                            return (
                                <div key={item.id} className={styles.navRow}>
                                    <button 
                                        type="button"
                                        onClick={() => toggleGroup(item.id)}
                                        className={`
                                            ${styles.navLink} 
                                            ${styles.navLinkButton}
                                            ${isLinkActive || isOpen ? styles.navLinkActive : ''}
                                        `}
                                    >
                                        <span className={styles.navIcon}>{item.icon}</span>
                                        <span className={styles.navLabel}>{item.label}</span>
                                        <span 
                                            className={styles.chevronRight}
                                            style={{ 
                                                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        >
                                            {Icons.chevronRight}
                                        </span>
                                    </button>

                                    {/* Inline Sub-items list on click */}
                                    {isOpen && (
                                        <div className={styles.subList}>
                                            {item.children?.map((child) => {
                                                const active = pathname === child.href;
                                                return (
                                                    <Link 
                                                        key={child.href}
                                                        href={child.href}
                                                        className={`${styles.subLink} ${active ? styles.subLinkActive : ''}`}
                                                        target={child.isExternal ? '_blank' : undefined}
                                                    >
                                                        <span className={styles.subDot} />
                                                        <span>{child.label}</span>
                                                        {child.isExternal && <span style={{ marginLeft: '4px' }}>{Icons.externalLink}</span>}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={item.id}
                                className={styles.navRow}
                                onMouseEnter={() => setHoveredItem(item.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                                ref={el => { itemRefs.current[item.id] = el; }}
                                style={{ position: 'relative' }}
                            >
                                <Link 
                                    href={item.href}
                                    className={`
                                        ${styles.navLink} 
                                        ${isLinkActive ? styles.navLinkActive : ''}
                                        ${isCollapsed ? styles.navLinkCollapsed : ''}
                                    `}
                                >
                                    <span className={styles.navIcon}>{item.icon}</span>
                                    {!isCollapsed && (
                                        <>
                                            <span className={styles.navLabel}>{item.label}</span>
                                            {hasChildren && <span className={styles.chevronRight}>{Icons.chevronRight}</span>}
                                        </>
                                    )}
                                </Link>

                                {/* Absolute Floating Submenu in Collapsed Mode */}
                                {hasChildren && isCollapsed && isHovered && (
                                    <div className={styles.flyout} style={{ top: '0px' }}>
                                        <div className={styles.flyoutHeader}>
                                            {item.label}
                                        </div>
                                        <div className={styles.flyoutList}>
                                            {item.children?.map((child, index) => {
                                                const isChildActive = pathname === child.href;
                                                return (
                                                    <Link 
                                                        key={child.href}
                                                        href={child.href}
                                                        className={`
                                                            ${styles.flyoutItem} 
                                                            ${index === 0 ? styles.flyoutItemFeatured : ''} 
                                                            ${isChildActive ? styles.flyoutItemActive : ''}
                                                        `}
                                                        target={child.isExternal ? '_blank' : undefined}
                                                        onClick={() => setHoveredItem(null)}
                                                    >
                                                        <span>{child.label}</span>
                                                        {child.isExternal && <span style={{ marginLeft: '4px' }}>{Icons.externalLink}</span>}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Area Wrapper */}
            <div className={styles.main}>
                {/* Slim Top Bar */}
                <header className={styles.topbar}>
                    {/* Brand wordmark logo only */}
                    <div className={styles.logoWrapper}>
                        <button className={styles.hamburger} onClick={() => setIsMobileOpen(!isMobileOpen)}>
                            {Icons.menu}
                        </button>
                        <Image 
                            src="/TalentMesh_page-0002-removebg-preview.png" 
                            alt="TalentMesh Logo" 
                            width={110} 
                            height={28}
                            unoptimized
                            style={{ objectFit: 'contain' }}
                        />
                    </div>

                    {/* Right Cluster: side-by-side icon+text labels */}
                    <div className={styles.topbarRight}>
                        <button className={styles.topLink} onClick={() => router.push('/')}>
                            {Icons.help}
                            <span>Help</span>
                        </button>

                        <button 
                            className={styles.topLink}
                            onClick={() => router.push(isRecruiterRoute ? `/dashboard/recruiter/${roleId}/notifications` : '/dashboard/admin/notifications')}
                        >
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                {Icons.bell}
                                {notifCount > 0 && <span className={styles.notifBadge} />}
                            </div>
                            <span>Notifications</span>
                        </button>

                        <button 
                            className={styles.topLink}
                            onClick={() => router.push(isRecruiterRoute ? `/dashboard/recruiter/${roleId}/messages` : '/dashboard/admin/audit-logs')}
                        >
                            {Icons.mail}
                            <span>Messages</span>
                        </button>

                        {/* User Account Dropdown */}
                        <div className={styles.accountMenu} ref={accountRef}>
                            <button 
                                className={styles.accountBtn}
                                onClick={() => setIsAccountOpen(!isAccountOpen)}
                            >
                                <div className={styles.avatar}>
                                    {user?.avatar_url ? (
                                        <img src={getPublicStorageUrl('avatars', user.avatar_url)} alt="Avatar" className={styles.avatarImg} />
                                    ) : (
                                        userInitials
                                    )}
                                </div>
                                <span className={styles.emailText}>{user?.email}</span>
                                {Icons.chevronDown}
                            </button>

                            {/* Dropdown options */}
                            {isAccountOpen && (
                                <div className={styles.accountDropdown}>
                                    <div className={styles.accountDropdownHeader}>
                                        <strong>{user?.name || 'User Account'}</strong>
                                        <span>{user?.email}</span>
                                    </div>
                                    <Link href={isRecruiterRoute ? `/dashboard/recruiter/${roleId}/settings` : '/dashboard/admin/settings'} className={styles.dropdownItem} onClick={() => setIsAccountOpen(false)}>
                                        Settings
                                    </Link>
                                    <button 
                                        onClick={handleSignOut} 
                                        className={`${styles.dropdownItem} ${styles.signOutBtn}`}
                                        disabled={isSigningOut}
                                    >
                                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area Pane */}
                <main className={styles.contentPane}>
                    {children}
                </main>
            </div>
        </div>
    );
}
