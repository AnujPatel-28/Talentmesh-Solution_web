import Link from "next/link";
import { getServerUser } from "@/lib/server-auth";
import styles from "./dashboard.module.css";

const adminRoutes = [
  { title: "Manage Jobs", href: "/dashboard/admin/jobs", description: "Review, publish, and moderate platform job postings." },
  { title: "Candidates", href: "/dashboard/admin/candidates", description: "Inspect candidate activity and application movement." },
  { title: "Recruiters", href: "/dashboard/admin/recruiters", description: "Approve recruiters and verify company accounts." },
  { title: "Reports", href: "/dashboard/admin/reports", description: "Check platform performance and hiring funnel visibility." },
];

export default async function AdminDashboardPage() {
  const user = await getServerUser();
  const adminName = user?.name || user?.email?.split("@")[0] || "Admin";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Admin Command Center</p>
          <h1 className={styles.title}>Welcome back, {adminName}</h1>
          <p className={styles.subtitle}>
            Your admin login now lands on the canonical dashboard route again. From here you can move across the restored
            admin workspace without falling into a missing page.
          </p>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusDot} />
          <div>
            <strong>Admin session active</strong>
            <p>Protected route restored at /dashboard/admin</p>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        {adminRoutes.map((route) => (
          <Link key={route.href} href={route.href} className={styles.card}>
            <h2>{route.title}</h2>
            <p>{route.description}</p>
            <span className={styles.cardLink}>Open section</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
