"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge, directInsforge } from '@/lib/insforge';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';
import { toast } from 'react-hot-toast';
import styles from './CandidateTopNavShell.module.css';

/* ─── SVG Icons ─── */
const Icons = {
    bookmark: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
    ),
    messages: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    bell: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    menu: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
        </svg>
    ),
    close: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

interface NavItem {
    label: string;
    href: string;
}

export default function CandidateTopNavShell({ children }: { children: React.ReactNode }) {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const isSubPage = useMemo(() => {
        if (!pathname) return false;
        if (pathname === '/candidate/dashboard' || pathname === '/candidate/dashboard/') return false;
        const match = pathname.match(/^\/dashboard\/candidate\/([^\/]+)\/?$/);
        if (match) return false;
        return true;
    }, [pathname]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [unreadNotif, setUnreadNotif] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);


    // Left Navigation Definitions (Find Jobs / Company reviews / Salary guide / My Jobs)
    const navItems = useMemo<NavItem[]>(() => [
        { label: 'Find Jobs', href: '/candidate/dashboard' },
        { label: 'My Jobs', href: '/candidate/dashboard/applications' },
        { label: 'Company reviews', href: '/candidate/dashboard/company-reviews' },
        { label: 'Salary guide', href: '/candidate/dashboard/salary-guide' },
    ], []);

    // Load unread notifications dot
    const loadMetadata = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data } = await insforge.database
                .from('notifications')
                .select('id')
                .eq('user_id', user.id)
                .eq('is_read', false)
                .limit(1);
            setUnreadNotif(!!(data && data.length > 0));
        } catch (e) {
            console.error('Failed to load notification dot:', e);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        loadMetadata();

        const handleUpdate = () => {
            loadMetadata();
        };

        const setupRealtime = async () => {
            try {
                await directInsforge.realtime.connect();
                await directInsforge.realtime.subscribe('notifications:' + user.id);
                directInsforge.realtime.on('INSERT_notifications', handleUpdate);
                directInsforge.realtime.on('UPDATE_notifications', handleUpdate);
            } catch (err) {
                console.error('Failed to setup realtime in top nav:', err);
            }
        };

        setupRealtime();

        return () => {
            directInsforge.realtime.off('INSERT_notifications', handleUpdate);
            directInsforge.realtime.off('UPDATE_notifications', handleUpdate);
            directInsforge.realtime.unsubscribe('notifications:' + user.id);
        };
    }, [user?.id, loadMetadata]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                avatarRef.current && !avatarRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Track internal dashboard navigation history to prevent back button from going to /login
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        try {
            const currentHistory = JSON.parse(sessionStorage.getItem('tm_candidate_history') || '[]');
            if (pathname && (pathname.startsWith('/candidate/dashboard') || pathname.startsWith('/dashboard/candidate'))) {
                // Keep the history clean, avoid consecutive duplicates
                if (currentHistory[currentHistory.length - 1] !== pathname) {
                    currentHistory.push(pathname);
                    sessionStorage.setItem('tm_candidate_history', JSON.stringify(currentHistory));
                }
            }
        } catch (e) {
            console.warn('Failed to update candidate history:', e);
        }
    }, [pathname]);

    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('tm_candidate_history');
            }
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

    const handleBackClick = () => {
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('app:back', { cancelable: true });
            const prevented = !window.dispatchEvent(event);
            if (prevented) return;
            
            try {
                const currentHistory = JSON.parse(sessionStorage.getItem('tm_candidate_history') || '[]');
                
                // Pop the current page first
                if (currentHistory.length > 0 && currentHistory[currentHistory.length - 1] === pathname) {
                    currentHistory.pop();
                }
                
                // Pop the actual previous page to go back to it
                const prevPage = currentHistory.pop();
                sessionStorage.setItem('tm_candidate_history', JSON.stringify(currentHistory));
                
                if (prevPage && (prevPage.startsWith('/candidate/dashboard') || prevPage.startsWith('/dashboard/candidate'))) {
                    router.push(prevPage);
                    return;
                }
            } catch (e) {
                console.warn('Failed to navigate using candidate history:', e);
            }
            
            router.push('/candidate/dashboard');
            return;
        }
        router.back();
    };

    const userInitials = useMemo(() => {
        if (user?.name) {
            return user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        }
        return 'C';
    }, [user?.name]);

    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <div className={styles.leftSection}>
                    {isSubPage && (
                        <button onClick={handleBackClick} className={styles.headerBackButton} title="Go Back">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                    )}
                    {/* Logo Only */}
                    <Link href="/candidate/dashboard" className={styles.brand}>
                        <Image
                            src="/TalentMesh_page-0002-removebg-preview.png"
                            alt="TalentMesh Logo"
                            width={150}
                            height={48}
                            unoptimized
                            style={{ objectFit: 'contain', maxHeight: '48px', height: 'auto', width: 'auto' }}
                        />
                    </Link>
                </div>

                {/* Main navigation links centered vertically & horizontally */}
                <nav className={styles.desktopNav}>
                    {navItems.map((item: NavItem) => {
                        const isActive = item.href === '/candidate/dashboard'
                            ? pathname === '/candidate/dashboard'
                            : pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navTab} ${isActive ? styles.navTabActive : ''}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.rightSection}>
                    {/* Right side icon cluster: Bookmark, Messages, Bell, Profile */}
                    <div className={styles.iconCluster}>
                        <Link href="/candidate/dashboard/saved-jobs" className={styles.iconBtn} title="Saved Jobs" style={{ width: 40, height: 40 }}>
                            {Icons.bookmark}
                        </Link>

                        <Link href="/candidate/dashboard/messages" className={styles.iconBtn} title="Messages" style={{ width: 40, height: 40 }}>
                            {Icons.messages}
                        </Link>

                        <Link href="/candidate/dashboard/notifications" className={styles.iconBtn} title="Notifications" style={{ width: 40, height: 40 }}>
                            {Icons.bell}
                            {unreadNotif && <span className={styles.notifDot} />}
                        </Link>

                        <div
                            ref={avatarRef}
                            className={styles.avatar}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{ width: 34, height: 34 }}
                        >
                            {user?.avatar_url ? (
                                <img src={getPublicStorageUrl('avatars', user.avatar_url)} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                userInitials
                            )}
                        </div>

                        {/* Mobile Hamburger menu */}
                        <button className={styles.hamburger} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? Icons.close : Icons.menu}
                        </button>
                    </div>
                </div>

                {/* Profile dropdown — Indeed style */}
                {isDropdownOpen && (
                    <div
                        ref={dropdownRef}
                        style={{
                            position: 'absolute',
                            top: '56px',
                            right: '16px',
                            width: '260px',
                            background: '#ffffff',
                            border: '1px solid #e2e5ea',
                            borderRadius: '8px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            overflow: 'hidden',
                            fontFamily: 'Inter, system-ui, sans-serif'
                        }}
                    >
                        {/* Email header */}
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e5ea' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#12263A', wordBreak: 'break-all' }}>
                                {user?.email}
                            </span>
                        </div>

                        {/* Menu items with icons */}
                        {([
                            {
                                label: 'Profile',
                                href: '/candidate/dashboard/profile',
                                icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
                            },
                            {
                                label: 'My reviews',
                                href: '/candidate/dashboard/referrals',
                                icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674z" /></svg>,
                            },
                            {
                                label: 'Settings',
                                href: '/candidate/dashboard/settings',
                                icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
                            },
                            {
                                label: 'Help',
                                href: '/candidate/dashboard',
                                icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
                            },
                            {
                                label: 'Privacy Centre',
                                href: '/candidate/dashboard/settings',
                                icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
                            },
                        ] as const).map(item => (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setIsDropdownOpen(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '11px 16px',
                                    fontSize: '14px',
                                    color: '#12263A',
                                    textDecoration: 'none',
                                    transition: 'background 0.12s'
                                }}
                                onMouseOver={e => (e.currentTarget.style.background = '#f8fafc')}
                                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <span style={{ color: '#475569', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}

                        {/* Sign out — blue link at bottom, separated */}
                        <div style={{ borderTop: '1px solid #e2e5ea', padding: '10px 16px' }}>
                            <button
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: '#007BFF',
                                    width: '100%',
                                    textAlign: 'left'
                                }}
                            >
                                {isSigningOut ? 'Signing out...' : 'Sign out'}
                            </button>
                        </div>
                    </div>
                )}

            </header>

            {/* Mobile Menu Drawer list */}
            <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
                {navItems.map((item: NavItem) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.mobileNavTab} ${isActive ? styles.mobileNavTabActive : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Main content body area */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
