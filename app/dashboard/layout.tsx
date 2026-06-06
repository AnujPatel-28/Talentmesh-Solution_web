"use client";
import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { useSearch, SearchProvider } from '@/context/SearchContext';
import SearchOverlay from '@/components/candidate/SearchOverlay';
import CenteredLoader from '@/components/ui/CenteredLoader';
import { insforge, invokeFunction, directInsforge } from '@/lib/insforge';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import { getPublicStorageUrl } from '@/lib/utils/storage-url';

import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';
import UniversalSearch from '@/components/admin/UniversalSearch';
import AnnouncementBanner from '@/components/shared/AnnouncementBanner';
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
    bookmark: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
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
    nvite: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    ),
    gift: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
    ),
    envelopeStar: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h7" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            <path d="m17.5 17.5 1.5 1.5 3-3" />
            <path d="M22 17a3 3 0 1 0-6 0 3 3 0 0 0 6 0z" />
        </svg>
    ),
    bell: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    sparkles: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        </svg>
    ),
    inbox: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
    ),
    megaphone: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 15h2a2 2 0 1 0 0-4h-2" /><path d="m4 11 6-6v14l-6-6H2v-2h2z" /><path d="M19 12c0-2.5-1.5-4.5-4-5v10c2.5-.5 4-2.5 4-5z" />
        </svg>
    ),
    envelope: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    ),
    creditCard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
    ),
    building: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
        </svg>
    ),
    fileText: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
    ),
};

const ChevronDown = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const DotIcon = (
    <svg width="5" height="5" viewBox="0 0 5 5" fill="currentColor"><circle cx="2.5" cy="2.5" r="2.5" /></svg>
);

const PipelineIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" />
    </svg>
);

const PlugIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8H6a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0v-3a2 2 0 0 0-2-2Z" />
    </svg>
);

/* ─── Nav Definitions ─── */
interface NavChild { label: string; href: string; }
interface NavItem { label: string; href: string; icon: React.ReactNode; badge?: number; badgeType?: 'primary' | 'red'; id?: string; children?: NavChild[]; }

const getCandidateNav = (role_id: string, nviteCount?: number, offerCount?: number): NavItem[] => [
    { label: 'Dashboard', href: `/dashboard/candidate/${role_id}`, icon: Icons.home },
    { label: 'Find Jobs', href: `/dashboard/candidate/${role_id}/jobs`, icon: Icons.briefcase },
    { label: 'My Applications', href: `/dashboard/candidate/${role_id}/applications`, icon: Icons.clipboard, badge: 5 },
    { label: 'NVite Inbox', href: `/candidate/nvite`, icon: Icons.nvite, badge: nviteCount },
    { label: 'Referrals', href: `/dashboard/candidate/${role_id}/referrals`, icon: Icons.gift },
    { label: 'Messages', href: `/dashboard/candidate/${role_id}/messages`, icon: Icons.messageSquare, badge: 3 },
    { label: 'My Profile', href: `/dashboard/candidate/${role_id}/profile`, icon: Icons.users },
    { label: 'My Resumes', href: `/dashboard/candidate/${role_id}/resumes`, icon: Icons.fileText },
];

const getRecruiterNav = (roleId: string): NavItem[] => [
    { label: 'Home', href: `/dashboard/recruiter/${roleId}`, icon: Icons.home, id: 'home' },
    {
        label: 'Jobs', href: `/dashboard/recruiter/${roleId}/jobs`, icon: Icons.edit, id: 'jobs',
        children: [
            { label: 'All Job Postings', href: `/dashboard/recruiter/${roleId}/jobs` },
            { label: 'Create Job', href: `/dashboard/recruiter/${roleId}/jobs/post-job` },
            { label: 'Draft Jobs', href: `/dashboard/recruiter/${roleId}/jobs/drafts` },
            { label: 'Published Jobs', href: `/dashboard/recruiter/${roleId}/jobs/published` },
            { label: 'Expired Jobs', href: `/dashboard/recruiter/${roleId}/jobs/expired` },
            { label: 'Job Templates', href: `/dashboard/recruiter/${roleId}/jobs/templates` },
        ],
    },
    {
        label: 'Candidates', href: `/dashboard/recruiter/${roleId}/candidates`, icon: Icons.users, id: 'candidates',
        children: [
            { label: 'Candidate List', href: `/dashboard/recruiter/${roleId}/candidates` },
            { label: 'Candidate Search', href: `/dashboard/recruiter/${roleId}/candidates/search` },
            { label: 'Saved Candidates', href: `/dashboard/recruiter/${roleId}/candidates/saved` },
            { label: 'Shortlisted', href: `/dashboard/recruiter/${roleId}/candidates/shortlisted` },
        ],
    },
    { label: 'Hiring Pipeline', href: `/dashboard/recruiter/${roleId}/pipeline`, icon: PipelineIcon, id: 'pipeline' },
    { label: 'NVite', href: `/dashboard/recruiter/${roleId}/nvite`, icon: Icons.nvite, id: 'nvite' },
    { label: 'Interviews', href: `/dashboard/recruiter/${roleId}/interviews`, icon: Icons.calendar, id: 'interviews' },
    {
        label: 'Communication', href: `/dashboard/recruiter/${roleId}/messages`, icon: Icons.messageSquare, id: 'communication',
        children: [
            { label: 'Inbox', href: `/dashboard/recruiter/${roleId}/messages` },
            { label: 'Notifications', href: `/dashboard/recruiter/${roleId}/notifications` },
        ],
    },
    { label: 'Offers', href: `/dashboard/recruiter/${roleId}/offers`, icon: Icons.gift, id: 'offers' },
    { label: 'Reports', href: `/dashboard/recruiter/${roleId}/reports`, icon: Icons.pieChart, id: 'reports' },
    { label: 'Integrations', href: `/dashboard/recruiter/${roleId}/integrations`, icon: PlugIcon, id: 'integrations' },
];

const SUPER_ADMIN_NAV = (counts?: { jobs: number, candidates: number, recruiters: number, pendingJobs: number }): NavItem[] => [
    { label: 'Overview', href: '/dashboard/admin', icon: Icons.home },
    { label: 'Job Approvals', href: '/dashboard/admin/job-approvals', icon: Icons.inbox, badge: counts?.pendingJobs || undefined, badgeType: 'red' },
    { label: 'Manage Jobs', href: '/dashboard/admin/jobs', icon: Icons.briefcase, badge: counts?.jobs || undefined },
    { label: 'Candidates', href: '/dashboard/admin/candidates', icon: Icons.users, badge: counts?.candidates || undefined },
    { label: 'Recruiters', href: '/dashboard/admin/recruiters', icon: Icons.recruiter, badge: counts?.recruiters || undefined },
    { label: 'Companies', href: '/dashboard/admin/companies', icon: Icons.building },
    { label: 'Announcements', href: '/dashboard/admin/announcements', icon: Icons.megaphone },
    { label: 'Email Templates', href: '/dashboard/admin/email-templates', icon: Icons.envelope },
    { label: 'Subscription Plans', href: '/dashboard/admin/plans', icon: Icons.creditCard },
    { label: 'Billing / Invoices', href: '/dashboard/admin/billing', icon: Icons.creditCard },
    { label: 'Blogs', href: '/dashboard/admin/blogs', icon: Icons.bookOpen },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: Icons.pieChart },
    { label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: Icons.fileText },
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
    const { user: authUser, isAdmin, signOut, isLoading, isInitialized } = useAuth();
    const isSuperAdmin = isAdmin || authUser?.role === 'admin' || authUser?.role === 'super_admin' || pathname.includes('/dashboard/admin') || pathname.includes('/admin/dashboard');
    const isRecruiter = authUser?.role === 'recruiter' || pathname.includes('/dashboard/recruiter') || pathname.includes('/recruiter/dashboard');
    const { openSearch } = useSearch();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
    const [adminCounts, setAdminCounts] = useState({ jobs: 0, candidates: 0, recruiters: 0, pendingJobs: 0 });
    const [nviteCount, setNviteCount] = useState(0);
    const [offerCount, setOfferCount] = useState(0);
    const [notifCount, setNotifCount] = useState(0);
    const isImpersonating = typeof window !== 'undefined' ? document.cookie.includes('tm_impersonating_user_id=') : false;

    React.useEffect(() => {
        if (!isInitialized || !authUser) return;

        const fetchStats = async () => {
            try {
                if (isAdmin) {
                    const { data } = await invokeFunction('admin-dashboard', { method: 'POST', body: { action: 'get-summary' } });
                    if (data) {
                        setAdminCounts({
                            jobs: data.metrics?.totalJobs || 0,
                            candidates: data.metrics?.totalCandidates || 0,
                            recruiters: data.metrics?.totalRecruiters || 0,
                            pendingJobs: data.alerts?.pendingJobs || 0
                        });
                        setNotifCount((data.alerts?.pendingRecruiters || 0) + (data.alerts?.pendingJobs || 0) + (data.alerts?.reportedJobs || 0));
                    }
                } else if (isRecruiter) {
                    const { data } = await invokeFunction('recruiter-dashboard');
                    if (data) {
                        setAdminCounts({ jobs: data.activeJobsCount || 0, candidates: data.totalApplications || 0, recruiters: 0, pendingJobs: 0 });
                    }
                } else {
                    const { data } = await invokeFunction('candidate-dashboard');
                    if (data) {
                        setNotifCount(data.appCount || 0);
                    }
                    
                    // Fetch NVite and Offer unread counts dynamically
                    const { data: profile } = await insforge.database.from('candidate_profiles').select('id').eq('id', authUser.id).single();
                    if (profile) {
                        const { count: nviteUnread } = await insforge.database
                            .from('nvites')
                            .select('*', { count: 'exact', head: true })
                            .eq('candidate_id', profile.id)
                            .eq('status', 'sent');

                        const { count: offerUnread } = await insforge.database
                            .from('offers')
                            .select('*', { count: 'exact', head: true })
                            .eq('candidate_id', profile.id)
                            .in('status', ['sent', 'viewed']);

                        setNviteCount(nviteUnread || 0);
                        localStorage.setItem('nvite_unread_count', (nviteUnread || 0).toString());
                        setOfferCount(offerUnread || 0);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 300000); // 5 mins
        return () => clearInterval(interval);
    }, [isAdmin, isRecruiter, authUser, isInitialized]);

    // Setup realtime live notifications
    React.useEffect(() => {
        if (!authUser) return;

        let active = true;
        const setupRealtime = async () => {
            try {
                // Extract token for realtime auth
                const tokenMatch = typeof document !== 'undefined' ? document.cookie.match(/tm_access_token=([^;]+)/) : null;
                let token = tokenMatch ? tokenMatch[1] : null;
                if (token && token.startsWith('Bearer%20')) {
                    token = decodeURIComponent(token).substring(7);
                }

                // Use directInsforge to bypass Next.js API proxy which doesn't support WebSockets well
                if (token) {
                    // Set auth token before connecting if we have one
                    // directInsforge.realtime.setAuth(token); // Usually needed if RLS is on channels
                }

                // Ensure connect() doesn't block forever
                const connectPromise = directInsforge.realtime.connect();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Realtime timeout')), 8000));
                
                await Promise.race([connectPromise, timeoutPromise]);

                if (isAdmin) {
                    await directInsforge.realtime.subscribe('admin:alerts');
                    directInsforge.realtime.on('new_alert', () => {
                        if (active) setNotifCount(prev => prev + 1);
                    });
                } else if (authUser?.id) {
                    await directInsforge.realtime.subscribe(`user:${authUser.id}`);
                    directInsforge.realtime.on('new_notification', () => {
                        if (active) setNotifCount(prev => prev + 1);
                    });
                }
            } catch (err) {
                // Silently fail realtime to avoid blocking UI cards
                console.warn('Realtime notifications connection issues:', err);
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


    // Extract ID from path if authUser is not yet loaded to show correct sidebar
    const pathSegments = pathname.split('/');
    const roleIdFromPath = pathSegments.find(s =>
        s.length === 36 || /^(cand|rec|adm)_[a-z0-9]+$/i.test(s)
    ) || '';

    const roleId = authUser?.id || roleIdFromPath;
    const navItems = isSuperAdmin ? SUPER_ADMIN_NAV(adminCounts) : isRecruiter ? getRecruiterNav(roleId) : getCandidateNav(roleId, nviteCount, offerCount);

    /* Auto-open the accordion group that contains the active route (recruiter) */
    useEffect(() => {
        if (!isRecruiter) return;
        const toOpen = new Set<string>();
        for (const item of navItems) {
            if (item.children?.some(c => pathname.startsWith(c.href.replace(/\/$/, '')))) {
                toOpen.add(item.id || item.label);
            }
        }
        if (toOpen.size > 0) {
            setOpenGroups(prev => new Set([...prev, ...toOpen]));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, roleId, isRecruiter]);

    const toggleGroup = useCallback((id: string) => {
        setOpenGroups(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const user = {
        name: authUser?.name || 'User',
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
        // Prevent redirect while loading
        if (!isInitialized) return;

        const isDedicatedBranch = 
            pathname.startsWith('/dashboard/admin') || 
            pathname.startsWith('/dashboard/recruiter') ||
            pathname.startsWith('/admin') ||
            pathname.startsWith('/recruiter');
        const hasToken = typeof window !== 'undefined' && document.cookie.includes('tm_access_token');

        // Only redirect if we are sure there is no session
        if (!isDedicatedBranch && !authUser && !hasToken) {
            router.push('/login');
        }
    }, [isLoading, authUser, router, pathname]);



    // Shell rendering logic
    const renderContent = () => {
        if (isLoading || !isInitialized) {
            return <HomeSkeleton />;
        }
        if (!authUser) {
            return null; // Will redirect via useEffect
        }
        
        return (
            <GlobalErrorBoundary>
                {isImpersonating && (
                    <ImpersonationBanner 
                        userName={authUser.name || 'User'} 
                        userEmail={authUser.email} 
                        role={authUser.role} 
                    />
                )}
                {children}
            </GlobalErrorBoundary>
        );
    };

    const homeUrl = isSuperAdmin ? '/dashboard/admin' : isRecruiter ? `/dashboard/recruiter/${roleId}` : authUser ? `/dashboard/candidate/${roleId}` : '/';

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
                        const normPathname = (pathname.replace(/\/$/, '') || '/').replace('/admin/dashboard', '/dashboard/admin');
                        const cleanItemHref = item.href.replace(/\/$/, '') || '/';
                        const isDashboardHome = cleanItemHref === `/dashboard/candidate/${roleId}` || cleanItemHref === `/dashboard/recruiter/${roleId}` || cleanItemHref === '/dashboard/admin';
                        const cleanPathname = normPathname
                            .replace(`/dashboard/candidate/${roleId}`, '/candidate/dashboard')
                            .replace(`/dashboard/recruiter/${roleId}`, '/recruiter/dashboard');
                        const cleanHref = cleanItemHref
                            .replace(`/dashboard/candidate/${roleId}`, '/candidate/dashboard')
                            .replace(`/dashboard/recruiter/${roleId}`, '/recruiter/dashboard');

                        /* ── Accordion group (has children) ── */
                        if (item.children && item.children.length > 0) {
                            const groupId = item.id || item.label;
                            const isOpen = openGroups.has(groupId);
                            const anyChildActive = item.children.some(c => {
                                const ch = (c.href.replace(/\/$/, '') || '')
                                    .replace(`/dashboard/candidate/${roleId}`, '/candidate/dashboard')
                                    .replace(`/dashboard/recruiter/${roleId}`, '/recruiter/dashboard');
                                return cleanPathname === ch || cleanPathname.startsWith(ch + '/');
                            });
                            return (
                                <div key={groupId} className={styles.navGroup}>
                                    <button
                                        className={`${styles.navGroupHeader} ${anyChildActive ? styles.navGroupActive : ''}`}
                                        onClick={() => toggleGroup(groupId)}
                                        aria-expanded={isOpen}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <span className={styles.navIcon}>{item.icon}</span>
                                        {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                                        {!collapsed && (
                                            <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                                                {ChevronDown}
                                            </span>
                                        )}
                                    </button>
                                    {!collapsed && (
                                        <div className={`${styles.navSubItems} ${isOpen ? styles.navSubItemsOpen : ''}`}>
                                            {item.children.map(child => {
                                                const ch = (child.href.replace(/\/$/, '') || '')
                                                    .replace(`/dashboard/candidate/${roleId}`, '/candidate/dashboard')
                                                    .replace(`/dashboard/recruiter/${roleId}`, '/recruiter/dashboard');
                                                const childActive = cleanPathname === ch || cleanPathname.startsWith(ch + '/');
                                                return (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        className={`${styles.navSubLink} ${childActive ? styles.navSubLinkActive : ''}`}
                                                        onClick={() => setMobileOpen(false)}
                                                    >
                                                        <span className={styles.subDot}>{DotIcon}</span>
                                                        {child.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        /* ── Flat link (no children) ── */
                        const active = isDashboardHome 
                            ? (cleanPathname === cleanHref || normPathname === cleanItemHref)
                            : (cleanPathname.startsWith(cleanHref) && (cleanPathname === cleanHref || cleanPathname.slice(cleanHref.length)[0] === '/'));

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
                                    <span className={`${styles.navBadge} ${item.badgeType === 'red' ? styles.navBadgeRed : ''}`}>{item.badge}</span>
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
                        href={isSuperAdmin ? '/dashboard/admin/settings' : isRecruiter ? `/dashboard/recruiter/${roleId}/settings` : `/dashboard/candidate/${roleId}/settings`}
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
                                    <div className={`${styles.userAvatar} ${styles.adminAvatar}`}>
                                        {authUser?.avatar_url ? (
                                            <img src={getPublicStorageUrl('avatars', authUser.avatar_url)} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                                        ) : (
                                            user.initials
                                        )}
                                    </div>
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
                            <div className={styles.userAvatar}>
                                {authUser?.avatar_url ? (
                                    <img src={getPublicStorageUrl('avatars', authUser.avatar_url)} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                                ) : (
                                    user.initials
                                )}
                            </div>
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
                        {(isSuperAdmin || isRecruiter) ? (
                            <UniversalSearch />
                        ) : (
                            <div className={styles.searchBox} onClick={openSearch} style={{ cursor: 'pointer' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem', userSelect: 'none' }}>Search jobs, skills...</span>
                            </div>
                        )}
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
                                        href={isSuperAdmin ? '/dashboard/admin/notifications' : isRecruiter ? `/dashboard/recruiter/${roleId}/notifications` : `/dashboard/candidate/${roleId}/notifications`}
                                        className={styles.notifFooter}
                                        onClick={() => setIsNotifOpen(false)}
                                    >
                                        View all notifications
                                    </Link>
                                </div>
                            )}
                        </div>
                        <Link
                            href={isSuperAdmin ? '/dashboard/admin/settings' : isRecruiter ? `/dashboard/recruiter/${roleId}/settings` : `/dashboard/candidate/${roleId}/profile`}
                            className={`${styles.topAvatar} ${isAdmin ? styles.adminAvatar : ''}`}
                        >
                            {authUser?.avatar_url ? (
                                <img src={getPublicStorageUrl('avatars', authUser.avatar_url)} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                user.initials
                            )}
                        </Link>
                    </div>
                </header>
                {!isAdmin && <AnnouncementBanner role={isRecruiter ? 'recruiter' : 'candidate'} />}
                <main className={styles.content}>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
