"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';
import AnnouncementBanner from '@/components/shared/AnnouncementBanner';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import styles from './recruiter-layout.module.css';

const Icons = {
    home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    pieChart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>,
    settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
    pipeline: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>,
    nvite: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
};

export default function RecruiterLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, signOut, isImpersonating } = useAuth();
    const [permissions, setPermissions] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (user?.id) {
            const fetchPerms = async () => {
                const { data } = await insforge.database
                    .from('recruiter_profiles')
                    .select('permissions')
                    .eq('id', user.id)
                    .single();
                setPermissions(data?.permissions || {});
                setLoading(false);
            };
            fetchPerms();
        }
    }, [user?.id]);

    const navItems = [
        { label: 'Home', href: '/dashboard/recruiter', icon: Icons.home, show: true },
        { label: 'Job Postings', href: '/dashboard/recruiter/jobs', icon: Icons.edit, show: permissions?.post_jobs },
        { label: 'Candidates', href: '/dashboard/recruiter/candidates', icon: Icons.users, show: permissions?.search_candidates },
        { label: 'Pipeline', href: '/dashboard/recruiter/pipeline', icon: Icons.pipeline, show: true },
        { label: 'NVite', href: '/recruiter/nvite', icon: Icons.nvite, show: true },
        { label: 'Interviews', href: '/dashboard/recruiter/interviews', icon: Icons.calendar, show: permissions?.schedule_interviews },
        { label: 'Analytics', href: '/dashboard/recruiter/analytics', icon: Icons.pieChart, show: permissions?.view_analytics },
        { label: 'Reports', href: '/dashboard/recruiter/reports', icon: Icons.pieChart, show: permissions?.view_analytics },
        { label: 'Settings', href: '/dashboard/recruiter/settings', icon: Icons.settings, show: true },
    ];

    if (loading && user) {
        return <HomeSkeleton />;
    }

    return (
        <div className={styles.shell}>
            {/* Mobile Top Bar */}
            <header className={styles.mobileTopbar}>
                <Image src="/TalentMesh_Logo-removebg-preview.png" alt="TalentMesh" width={32} height={32} unoptimized />
                <button className={styles.hamburger} onClick={() => setIsMenuOpen(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </header>

            {/* Overlay */}
            {isMenuOpen && <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />}

            <aside className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHead}>
                    <Image src="/TalentMesh_page-0002-removebg-preview.png" alt="TalentMesh" width={140} height={38} unoptimized />
                    <button className={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <nav className={styles.nav}>
                    {navItems.filter(i => i.show).map(item => {
                        const active = pathname === item.href;
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href} 
                                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span className={styles.navLabel}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className={styles.sidebarFoot}>
                    <div className={styles.userCard}>
                       <div className={styles.avatar}>{(user?.name?.[0] || 'R').toUpperCase()}</div>
                       <div className={styles.userMeta}>
                           <span className={styles.userName}>{user?.name}</span>
                           <span className={styles.userRole}>Recruiter</span>
                       </div>
                    </div>
                    <button onClick={() => signOut()} className={styles.logoutBtn}>Logout</button>
                </div>
            </aside>
            <main className={styles.main}>
                <header className={styles.topbar}>
                    <h1 className={styles.pageTitle}>Recruiter Dashboard</h1>
                </header>
                <AnnouncementBanner role="recruiter" />
                <div className={styles.content}>
                    {isImpersonating && user && (
                        <ImpersonationBanner 
                            userName={user.name || 'User'} 
                            userEmail={user.email} 
                            role={user.role} 
                        />
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}
