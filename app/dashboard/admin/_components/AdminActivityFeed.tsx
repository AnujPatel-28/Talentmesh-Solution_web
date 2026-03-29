'use client';

import React from 'react';
import styles from '../dashboard.module.css';

interface ActivityItem {
  id: string;
  actor: string;
  actor_avatar?: string;
  type: string;
  description: string;
  created_at: string;
}

interface AdminActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function AdminActivityFeed({ activities, isLoading }: AdminActivityFeedProps) {
  const getTimeAgo = (date: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className={styles.activityFeed}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Recent Ecosystem Activity</h2>
      </div>
      
      <div className={styles.timeline}>
        {isLoading ? (
          <div className={styles.emptyState}>Syncing activities...</div>
        ) : activities.length > 0 ? (
          activities.map((item) => (
            <div key={item.id} className={styles.activityItem}>
              <div className={styles.activityAvatar}>
                {item.actor_avatar ? (
                  <img src={item.actor_avatar} alt={item.actor} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (
                  item.actor ? item.actor[0].toUpperCase() : 'A'
                )}
              </div>
              <div className={styles.activityBody}>
                <p className={styles.activityTitle}>
                  <strong>{item.actor}</strong> {item.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className={styles.activityTime}>{getTimeAgo(item.created_at)}</span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '1px 6px', 
                    borderRadius: '4px', 
                    backgroundColor: '#f1f5f9', 
                    color: '#64748b', 
                    textTransform: 'uppercase', 
                    fontWeight: 700 
                  }}>
                    {item.type}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>No activity recorded in the last 24 hours.</div>
        )}
      </div>
    </div>
  );
}
