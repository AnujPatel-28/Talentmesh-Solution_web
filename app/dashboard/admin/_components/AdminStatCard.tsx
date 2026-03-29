'use client';

import React from 'react';
import styles from '../dashboard.module.css';

interface AdminStatCardProps {
  label: string;
  value: number | string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose';
}

export function AdminStatCard({ 
  label, 
  value, 
  trend, 
  trendValue, 
  icon,
  color = 'blue' 
}: AdminStatCardProps) {
  const colorMap = {
    blue: { bg: '#eff6ff', text: '#1d4ed8', iconBg: 'rgba(37, 99, 235, 0.1)' },
    indigo: { bg: '#eef2ff', text: '#4338ca', iconBg: 'rgba(79, 70, 229, 0.1)' },
    emerald: { bg: '#ecfdf5', text: '#047857', iconBg: 'rgba(16, 185, 129, 0.1)' },
    amber: { bg: '#fffbeb', text: '#b45309', iconBg: 'rgba(245, 158, 11, 0.1)' },
    rose: { bg: '#fff1f2', text: '#be123c', iconBg: 'rgba(225, 29, 72, 0.1)' },
  };

  const theme = colorMap[color];

  return (
    <div className={styles.statCard}>
      <div className={styles.statCardHeader}>
        <div 
          className={styles.statIconBox}
          style={{ 
            backgroundColor: theme.iconBg, 
            color: theme.text
          }}
        >
          {icon || (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21H3V3" /><path d="m21 15-5-5-5 5-5-5" />
            </svg>
          )}
        </div>
        {trend && (
          <div className={`${styles.trend} ${trend === 'up' ? styles.trendUp : styles.trendDown}`}>
            {trend === 'up' ? '↗' : '↘'} {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
      
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statValue}>{value}</div>
      
      <div className={styles.statProgressBar}>
        <div 
          className={styles.statProgressFill}
          style={{ 
            width: '60%', 
            backgroundColor: theme.text,
          }} 
        />
      </div>
    </div>
  );
}
