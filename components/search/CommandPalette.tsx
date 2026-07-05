"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './CommandPalette.module.css';

type CommandItem = {
    id: string;
    category: 'actions' | 'jobs' | 'candidates' | 'settings' | 'general';
    title: string;
    subtitle: string;
    route: string;
    icon: string;
    shortcut?: string;
};

export default function CommandPalette() {
    const { user, isAdmin } = useAuth();
    const isSuperAdmin = isAdmin;
    const isRecruiter = user?.role === 'recruiter';
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<'all' | 'actions' | 'jobs' | 'candidates' | 'settings'>('all');
    const [activeIndex, setActiveIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const roleId = user?.id || '';

    // Listen for Ctrl+K / Cmd+K key combo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle scroll blocking and focus pull when opened
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setActiveIndex(0);
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen]);

    // Handle clicks outside of dialog box
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    };

    // Registry of available commands based on user authority role
    const commandsList = useMemo<CommandItem[]>(() => {
        if (!user) return [];

        const generalItems: CommandItem[] = [
            { id: 'settings', category: 'settings', title: 'Settings & Preferences', subtitle: 'Manage profile and account details', route: isSuperAdmin ? '/dashboard/admin/settings' : isRecruiter ? `/dashboard/recruiter/${roleId}/settings` : `/dashboard/candidate/${roleId}/settings`, icon: '⚙️', shortcut: '⌘S' },
            { id: 'messages', category: 'general', title: 'Inbox & Messages', subtitle: 'Check conversations and updates', route: isSuperAdmin ? `/dashboard/admin/${roleId}/messages` : isRecruiter ? `/dashboard/recruiter/${roleId}/messages` : `/dashboard/candidate/${roleId}/messages`, icon: '💬', shortcut: '⌘M' },
        ];

        if (isSuperAdmin) {
            return [
                { id: 'admin-home', category: 'actions', title: 'Admin Governance Hub', subtitle: 'Monitor telemetry and activity indicators', route: '/dashboard/admin', icon: '🏠', shortcut: '⌘H' },
                { id: 'approvals', category: 'actions', title: 'Pending Approval Requests', subtitle: 'Approve or reject pending recruiters', route: '/admin/recruiter-requests', icon: '🔑', shortcut: '⌘A' },
                { id: 'companies', category: 'actions', title: 'Manage Companies Registry', subtitle: 'Audit and modify registered partner companies', route: '/dashboard/admin/companies', icon: '🏢' },
                { id: 'candidates', category: 'candidates', title: 'Manage Candidates Directory', subtitle: 'Audit candidate profiles and parse logs', route: '/dashboard/admin/candidates', icon: '👤' },
                { id: 'recruiters', category: 'actions', title: 'Manage Recruiters Team', subtitle: 'Assign recruiter permissions and roles', route: '/dashboard/admin/recruiters', icon: '👥' },
                { id: 'email-templates', category: 'settings', title: 'System Email Templates', subtitle: 'Manage verification and proposal mail formats', route: '/admin/email-templates', icon: '✉️' },
                ...generalItems
            ];
        }

        if (isRecruiter) {
            return [
                { id: 'recruiter-home', category: 'actions', title: 'Recruiter Dashboard Home', subtitle: 'View active applications metrics', route: `/dashboard/recruiter/${roleId}`, icon: '🏠', shortcut: '⌘H' },
                { id: 'post-job', category: 'jobs', title: 'Post New Job Opening', subtitle: 'Configure job board details and requirements', route: `/dashboard/recruiter/${roleId}/jobs/post-job`, icon: '✍️', shortcut: '⌘N' },
                { id: 'pipeline', category: 'jobs', title: 'Hiring Pipeline Kanban', subtitle: 'Track candidate stages sequence', route: `/dashboard/recruiter/${roleId}/pipeline`, icon: '📊', shortcut: '⌘P' },
                { id: 'search-candidates', category: 'candidates', title: 'Search Candidates Talent Pool', subtitle: 'Find candidates matching core skills', route: `/dashboard/recruiter/${roleId}/candidates/search`, icon: '🔍', shortcut: '⌘F' },
                { id: 'jobs-list', category: 'jobs', title: 'Manage Active Jobs List', subtitle: 'View published, draft, or expired openings', route: `/dashboard/recruiter/${roleId}/jobs`, icon: '💼' },
                { id: 'interviews', category: 'actions', title: 'Interviews & Evaluations Schedule', subtitle: 'Check scheduled candidate loops', route: `/dashboard/recruiter/${roleId}/interviews`, icon: '📅' },
                ...generalItems
            ];
        }

        // Candidate role
        return [
            { id: 'candidate-home', category: 'actions', title: 'Candidate Dashboard Home', subtitle: 'Check job recommendations and alerts', route: `/dashboard/candidate/${roleId}`, icon: '🏠', shortcut: '⌘H' },
            { id: 'search-jobs', category: 'jobs', title: 'Browse Active Jobs Board', subtitle: 'Search positions, filters, and locations', route: `/dashboard/candidate/${roleId}/search`, icon: '🔍', shortcut: '⌘F' },
            { id: 'applications', category: 'jobs', title: 'My Job Applications Tracker', subtitle: 'Track status stages and review results', route: `/dashboard/candidate/${roleId}/applications`, icon: '📋', shortcut: '⌘A' },
            { id: 'profile', category: 'candidates', title: 'My Candidate Profile Info', subtitle: 'Modify resume, bio, skills, and goals', route: `/dashboard/candidate/${roleId}/profile`, icon: '👤', shortcut: '⌘P' },
            { id: 'resumes', category: 'candidates', title: 'Manage Resumes & Documents', subtitle: 'Upload PDF resumes and parse files', route: `/dashboard/candidate/${roleId}/resumes`, icon: '📄' },
            { id: 'saved-jobs', category: 'jobs', title: 'Saved Jobs Bookmarks', subtitle: 'View bookmarked job openings', route: `/dashboard/candidate/${roleId}/saved-jobs`, icon: '🔖' },
            ...generalItems
        ];
    }, [user, isSuperAdmin, isRecruiter, roleId]);

    // Filter results based on search input and active tab category
    const filteredItems = useMemo(() => {
        let items = commandsList;

        if (activeCategory !== 'all') {
            items = items.filter(item => item.category === activeCategory);
        }

        if (query.trim() !== '') {
            const lowQuery = query.toLowerCase();
            items = items.filter(item => 
                item.title.toLowerCase().includes(lowQuery) || 
                item.subtitle.toLowerCase().includes(lowQuery) ||
                item.category.toLowerCase().includes(lowQuery)
            );
        }

        return items;
    }, [commandsList, query, activeCategory]);

    // Handle index reset on changes
    useEffect(() => {
        setActiveIndex(0);
    }, [query, activeCategory]);

    // Key handlers inside dialog
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[activeIndex]) {
                handleItemSelect(filteredItems[activeIndex]);
            }
        }
    };

    const handleItemSelect = (item: CommandItem) => {
        setIsOpen(false);
        router.push(item.route);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal} ref={modalRef}>
                {/* Search Bar */}
                <div className={styles.searchHeader}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search candidates, jobs, or command actions..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={styles.searchInput}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className={styles.escBadge}>esc</kbd>
                </div>

                {/* Filters Tab Row */}
                <div className={styles.filtersBar}>
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'actions', label: 'Actions' },
                        { id: 'jobs', label: 'Jobs' },
                        { id: 'candidates', label: 'Candidates' },
                        { id: 'settings', label: 'Settings' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveCategory(tab.id as any)}
                            className={`${styles.filterBtn} ${activeCategory === tab.id ? styles.filterBtnActive : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Results List */}
                <div className={styles.resultsList}>
                    {filteredItems.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyTitle}>No matching commands or links found</p>
                            <p className={styles.emptySubtitle}>Adjust your keywords or select another filter tag above.</p>
                        </div>
                    ) : (
                        filteredItems.map((item, index) => {
                            const isFocused = index === activeIndex;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemSelect(item)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={`${styles.resultItem} ${isFocused ? styles.resultItemFocused : ''}`}
                                >
                                    <div className={styles.itemIcon}>{item.icon}</div>
                                    <div className={styles.itemMeta}>
                                        <div className={styles.itemTitle}>{item.title}</div>
                                        <div className={styles.itemSubtitle}>{item.subtitle}</div>
                                    </div>
                                    <div className={styles.itemRight}>
                                        {item.shortcut && (
                                            <kbd className={styles.itemShortcut}>{item.shortcut}</kbd>
                                        )}
                                        {isFocused && <span className={styles.enterArrow}>↵</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer hints */}
                <div className={styles.footer}>
                    <span className={styles.hintText}>
                        <kbd className={styles.kbd}>↑↓</kbd> to navigate
                    </span>
                    <span className={styles.hintText}>
                        <kbd className={styles.kbd}>enter</kbd> to select
                    </span>
                    <span className={styles.hintText}>
                        <kbd className={styles.kbd}>esc</kbd> to dismiss
                    </span>
                </div>
            </div>
        </div>
    );
}
