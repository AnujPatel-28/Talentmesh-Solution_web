"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { insforge } from "@/lib/insforge";
import styles from "./layout.module.css";

const Icons = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  briefcase: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  building: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="9" y1="22" x2="9" y2="22" /><line x1="15" y1="22" x2="15" y2="22" /><line x1="12" y1="18" x2="12" y2="18" /><line x1="12" y1="14" x2="12" y2="14" /><line x1="12" y1="10" x2="12" y2="10" /><line x1="12" y1="6" x2="12" y2="6" /></svg>,
  clipboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
  barChart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  creditCard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  signOut: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: "amber";
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [counts, setCounts] = useState({ candidates: 0, recruiters: 0, jobs: 0 });

  useEffect(() => {
    async function fetchCounts() {
      const [
        { count: candidates },
        { count: recruiters },
        { count: jobs }
      ] = await Promise.all([
        insforge.database.from("candidate_profiles").select("*", { count: "exact", head: true }),
        insforge.database.from("recruiter_profiles").select("*", { count: "exact", head: true }).eq("is_approved", false),
        insforge.database.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      setCounts({
        candidates: candidates || 0,
        recruiters: recruiters || 0,
        jobs: jobs || 0,
      });
    }
    fetchCounts().catch(console.error);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const adminInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || 'A';

  const navSections: NavSection[] = [
    {
      title: "Overview",
      items: [{ label: "Dashboard", href: "/dashboard/admin", icon: Icons.dashboard }],
    },
    {
      title: "Users",
      items: [
        { label: "Candidates", href: "/dashboard/admin/candidates", icon: Icons.users, badge: counts.candidates },
        { label: "Recruiters", href: "/dashboard/admin/recruiters", icon: Icons.users, badge: counts.recruiters, badgeColor: "amber" },
        { label: "Admin Team", href: "/dashboard/admin/team", icon: Icons.shield },
      ],
    },
    {
      title: "Content",
      items: [
        { label: "All Jobs", href: "/dashboard/admin/jobs", icon: Icons.briefcase, badge: counts.jobs, badgeColor: "amber" },
        { label: "Companies", href: "/dashboard/admin/companies", icon: Icons.building },
        { label: "Applications", href: "/dashboard/admin/applications", icon: Icons.clipboard },
        { label: "Blogs", href: "/dashboard/admin/blogs", icon: Icons.clipboard },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Analytics", href: "/dashboard/admin/reports", icon: Icons.barChart },
        { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: Icons.clipboard },
        { label: "Settings", href: "/dashboard/admin/settings", icon: Icons.settings },
        { label: "Billing", href: "/dashboard/admin/billing", icon: Icons.creditCard },
      ],
    },
  ];

  return (
    <div className={styles.container}>
      {/* Sidebar Overlay (Mobile) */}
      {isMobileOpen && <div className={styles.overlay} onClick={() => setIsMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        ${styles.sidebar} 
        ${!isSidebarOpen ? styles.sidebarCollapsed : ''} 
        ${isMobileOpen ? styles.sidebarOpen : ''}
      `}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoRow}>
            <Link href="/" className={styles.brandLink}>
              {!isSidebarOpen && !isMobileOpen ? (
                <div className={styles.logoWrapper}>
                  <Image
                    src="/TalentMesh_Logo-removebg-preview.png"
                    alt="TalentMesh Icon"
                    width={32}
                    height={32}
                    className={styles.brandIconWhite}
                    unoptimized
                  />
                </div>
              ) : (
                <Image
                  src="/TalentMesh_page-0002-removebg-preview.png"
                  alt="TalentMesh"
                  width={240}
                  height={48}
                  className={styles.brandLogoContent}
                  style={{ objectFit: 'contain' }}
                  unoptimized
                />
              )}
            </Link>
            <button className={styles.closeBtn} onClick={() => setIsMobileOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {(isSidebarOpen || isMobileOpen) && (
            <div className={styles.adminCard}>
              <div className={styles.avatar}>{adminInitials}</div>
              <div className={styles.adminInfo}>
                <span className={styles.adminName}>{user?.name || "Admin"}</span>
                <span className={styles.roleBadge}>Super Administrator</span>
              </div>
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              {(isSidebarOpen || isMobileOpen) && <span className={styles.sectionTitle}>{section.title}</span>}
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                    onClick={() => setIsMobileOpen(false)}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {(isSidebarOpen || isMobileOpen) && <span className={styles.navLabel}>{item.label}</span>}
                    {(isSidebarOpen || isMobileOpen) && item.badge ? (
                      <span className={`${styles.badge} ${item.badgeColor === "amber" ? styles.badgeAmber : ""}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button className={styles.signOutBtn} onClick={() => signOut()}>
            <span className={styles.navIcon}>{Icons.signOut}</span>
            {(isSidebarOpen || isMobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className={styles.main}>
        {/* Top Bar - Responsive */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button className={styles.hamburger} onClick={toggleSidebar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <button className={styles.hamburgerMobile} onClick={toggleMobile}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search..."
                className={styles.topSearch}
              />
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
          </div>

          <div className={styles.topBarRight}>
            <button className={styles.iconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            </button>
            <div className={styles.divider} />
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>{adminInitials}</div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>{user?.name || "Admin"}</div>
                <div className={styles.userRole}>Super Admin</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
