"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './ProfileStrengthWidget.module.css';

import { getPublicStorageUrl } from '@/lib/utils/storage-url';

interface ProfileStrengthWidgetProps {
  candidate: {
    avatar_url?: string | null;
    resume_url?: string | null;
    bio?: string | null;
    skills?: string[] | null;
    experience?: any[] | null;
    education?: string | any[] | null;
    location?: string | null;
  };
  variant?: 'compact' | 'full';
}

interface ProfileField {
  key: string;
  label: string;
  points: number;
  completed: boolean;
  action: string;
  actionLabel: string;
}

export default function ProfileStrengthWidget({ candidate, variant = 'compact' }: ProfileStrengthWidgetProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const fields: ProfileField[] = useMemo(() => [
    { 
      key: 'avatar', 
      label: 'Profile Photo', 
      points: 15, 
      completed: !!candidate.avatar_url,
      action: '/dashboard/candidate/profile#photo', 
      actionLabel: 'Add Photo' 
    },
    { 
      key: 'resume', 
      label: 'Resume / CV', 
      points: 25,
      completed: !!candidate.resume_url,
      action: '/dashboard/candidate/profile#resume', 
      actionLabel: 'Upload Resume' 
    },
    { 
      key: 'bio', 
      label: 'Professional Summary', 
      points: 15,
      completed: (candidate.bio?.trim().length ?? 0) >= 30,
      action: '/dashboard/candidate/profile#bio', 
      actionLabel: 'Write Summary' 
    },
    { 
      key: 'skills', 
      label: 'Skills (5+ added)', 
      points: 15,
      completed: (candidate.skills?.length ?? 0) >= 5,
      action: '/dashboard/candidate/profile#skills', 
      actionLabel: 'Add Skills' 
    },
    { 
      key: 'experience', 
      label: 'Work Experience', 
      points: 15,
      completed: Array.isArray(candidate.experience) && candidate.experience.length >= 1,
      action: '/dashboard/candidate/profile#experience', 
      actionLabel: 'Add Experience' 
    },
    { 
      key: 'education', 
      label: 'Education', 
      points: 10,
      completed: typeof candidate.education === 'string' 
        ? candidate.education.trim().length > 0 
        : Array.isArray(candidate.education) && candidate.education.length >= 1,
      action: '/dashboard/candidate/profile#education', 
      actionLabel: 'Add Education' 
    },
    { 
      key: 'location', 
      label: 'Location', 
      points: 5,
      completed: !!candidate.location,
      action: '/dashboard/candidate/profile#location', 
      actionLabel: 'Add Location' 
    },
  ], [candidate]);

  const totalScore = useMemo(() => 
    fields.filter(f => f.completed).reduce((sum, f) => sum + f.points, 0)
  , [fields]);

  const sortedFields = useMemo(() => 
    [...fields].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    })
  , [fields]);

  const getStrengthLabel = (score: number) => {
    if (score <= 30) return { label: 'Beginner', color: '#ef4444' };
    if (score <= 60) return { label: 'Getting Started', color: '#f97316' };
    if (score <= 80) return { label: 'Good', color: '#eab308' };
    if (score <= 95) return { label: 'Strong', color: '#22c55e' };
    return { label: 'Complete', color: '#22c55e', icon: true };
  };

  const strength = getStrengthLabel(totalScore);
  const incompleteCount = fields.filter(f => !f.completed).length;

  if (variant === 'compact') {
    return (
      <div className={`${styles.compactWrapper} ${animated ? styles.animated : ''}`}>
        <div className={styles.compactHeader}>
          <div className={styles.avatarCircle}>
             {candidate.avatar_url ? (
               <img src={getPublicStorageUrl('avatars', candidate.avatar_url)} alt="Profile" />
             ) : (
               <span>✦</span>
             )}
          </div>
          <div className={styles.compactTitleArea}>
            <div className={styles.compactTitleRow}>
              <span className={styles.compactLabel}>Profile Strength</span>
              <span className={styles.compactPercentage}>{totalScore}%</span>
            </div>
            <div className={styles.progressBarBg}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: animated ? `${totalScore}%` : '0%' }}
              />
            </div>
            <p className={styles.compactStatus}>
              {strength.label} — {incompleteCount} {incompleteCount === 1 ? 'item' : 'items'} to complete
            </p>
          </div>
        </div>
        <Link href="/dashboard/candidate/profile" className={styles.seeDetails}>
          See Details →
        </Link>
      </div>
    );
  }

  // Full Variant
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - totalScore / 100);

  return (
    <div className={`${styles.fullWrapper} ${animated ? styles.animated : ''}`}>
      <div className={styles.chartArea}>
        <div className={styles.circleContainer}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle 
              cx="60" cy="60" r="54" 
              fill="none" 
              stroke="#e5e7eb" 
              strokeWidth="8" 
            />
            <circle 
              cx="60" cy="60" r="54" 
              fill="none" 
              stroke={strength.color} 
              strokeWidth="8" 
              strokeDasharray={circumference}
              strokeDashoffset={animated ? dashOffset : circumference}
              strokeLinecap="round"
              className={styles.progressArc}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className={styles.centerText}>
            <span className={styles.scoreNumber}>{totalScore}%</span>
            <span className={styles.scoreSub}>Strength</span>
          </div>
        </div>
        
        <div className={styles.strengthMeta}>
           <h3 className={styles.strengthLabel} style={{ color: strength.color }}>
             {strength.label} {strength.icon && '✓'}
           </h3>
           <p className={styles.strengthHint}>
             {totalScore < 100 
               ? `Complete ${incompleteCount} more ${incompleteCount === 1 ? 'task' : 'tasks'} to reach 100%`
               : 'Your profile is looking great!'}
           </p>
        </div>
      </div>

      <div className={styles.checklist}>
        {sortedFields.map(field => (
          <div key={field.key} className={`${styles.checkItem} ${field.completed ? styles.completed : ''}`}>
            <div className={styles.checkIcon}>
              {field.completed ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <div className={styles.emptyCircle} />
              )}
            </div>
            <div className={styles.checkBody}>
              <span className={styles.fieldLabel}>{field.label}</span>
              {!field.completed && (
                <Link href={field.action} className={styles.actionLink}>
                  → {field.actionLabel}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
