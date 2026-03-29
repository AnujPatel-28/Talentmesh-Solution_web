'use client';

import React from 'react';
import styles from '../dashboard.module.css';

interface AdminHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AdminHeader({ 
  title, 
  eyebrow, 
  subtitle, 
  actions, 
  breadcrumbs 
}: AdminHeaderProps) {
  return (
    <header className={styles.hero} style={{ marginBottom: '2rem' }}>
      <div className={styles.headerBody}>
        {breadcrumbs && (
          <nav className={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.label}>
                {i > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                <span className={`${styles.breadcrumbItem} ${i === breadcrumbs.length - 1 ? styles.breadcrumbActive : ''}`}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && (
        <div className={styles.bulkButtons}>
          {actions}
        </div>
      )}
    </header>
  );
}
