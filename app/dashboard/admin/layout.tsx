"use client";

import React, { useEffect, useState } from "react";
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

type Counts = {
  candidates: number;
  recruiters: number;
  jobs: number;
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
  const [counts, setCounts] = useState<Counts>({ candidates: 0, recruiters: 0, jobs: 0 });

  useEffect(() => {
    let mounted = true;

    async function fetchCounts() {
      const [{ count: candidates }, { count: recruiters }, { count: jobs }] = await Promise.all([
        insforge.database.from("candidate_profiles").select("*", { count: "exact", head: true }),
        insforge.database.from("recruiter_profiles").select("*", { count: "exact", head: true }).eq("is_approved", false),
        insforge.database.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      if (mounted) {
        setCounts({
          candidates: candidates || 0,
          recruiters: recruiters || 0,
          jobs: jobs || 0,
        });
      }
    }

    fetchCounts().catch(() => {
      if (mounted) {
        setCounts({ candidates: 0, recruiters: 0, jobs: 0 });
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const initials = (user?.name?.split(" ").map((part) => part[0]).join("") || "A").toUpperCase();
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
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoRow}>
            <Image src="/TalentMesh_Logo-removebg-preview.png" alt="TalentMesh" width={32} height={32} unoptimized />
            <span className={styles.portalBadge}>Admin Portal</span>
          </div>

          <div className={styles.adminCard}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.adminInfo}>
              <span className={styles.adminName}>{user?.name || "Admin"}</span>
              <div className={styles.roleBadge}>Admin</div>
              <span className={styles.mfaStatus}>Secure session active</span>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <span className={styles.sectionTitle}>{section.title}</span>
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}>
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                    {"badge" in item && item.badge ? (
                      <span className={`${styles.badge} ${item.badgeColor === "amber" ? styles.badgeAmber : ""}`}>{item.badge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button onClick={() => signOut()} className={styles.signOutBtn}>
            <span className={styles.navIcon}>{Icons.signOut}</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
