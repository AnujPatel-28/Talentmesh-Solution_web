'use client';
import React, { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { STATUS_LABELS } from '@/lib/constants/applicationStatuses';
import styles from './ApplicationTimeline.module.css';

interface ApplicationTimelineProps {
  applicationId: string;
  currentStatus: string;
  appliedAt: string;
}

interface StatusHistory {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_at: string;
  note: string | null;
}

const STAGES = [
  { key: 'applied', label: STATUS_LABELS.applied, icon: '📝', aliases: ['applied'] },
  { key: 'reviewing', label: STATUS_LABELS.reviewing, icon: '🔍', aliases: ['screening', 'reviewing'] },
  { key: 'shortlisted', label: STATUS_LABELS.shortlisted, icon: '⭐', aliases: ['shortlisted'] },
  { key: 'interviewing', label: STATUS_LABELS.interviewing, icon: '🎙️', aliases: ['interviewing', 'interview'] },
  { key: 'offered', label: STATUS_LABELS.offered, icon: '📋', aliases: ['offer', 'offered'] },
  { key: 'hired', label: STATUS_LABELS.hired.replace(' 🎉', ''), icon: '🎉', aliases: ['hired'] },
];

const TERMINAL_STAGES: Record<string, { label: string, icon: string, class: string }> = {
  rejected: { label: STATUS_LABELS.rejected, icon: '✕', class: styles.terminal },
  withdrawn: { label: STATUS_LABELS.withdrawn, icon: '↩', class: styles.withdrawn },
  accepted: { label: STATUS_LABELS.hired, icon: '✅', class: styles.completed }, // Some use accepted as terminal
};

const FRIENDLY_MESSAGES: Record<string, string> = {
  'applied': 'Application submitted',
  'screening': "Your application caught the recruiter's attention",
  'reviewing': "Your application caught the recruiter's attention",
  'shortlisted': "Great news — you've been shortlisted!",
  'interviewing': "An interview has been scheduled",
  'interview': "An interview has been scheduled",
  'offer': "An offer has been extended to you",
  'offered': "An offer has been extended to you",
  'hired': "Congratulations on your new role!",
  'rejected': "This application has concluded",
  'withdrawn': "You withdrew this application",
};

export default function ApplicationTimeline({ applicationId, currentStatus, appliedAt }: ApplicationTimelineProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await insforge.database
          .from('application_status_history')
          .select('*')
          .eq('application_id', applicationId)
          .order('changed_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setHistory(data);
        } else {
          // Fallback: Synthesize history
          const synth: StatusHistory[] = [
            { id: 'initial', from_status: null, to_status: 'applied', changed_at: appliedAt, note: null }
          ];
          if (currentStatus !== 'applied') {
            synth.push({ id: 'current', from_status: 'applied', to_status: currentStatus, changed_at: new Date().toISOString(), note: null });
          }
          setHistory(synth);
        }
      } catch (err) {
        console.error('Error fetching status history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [applicationId, currentStatus, appliedAt]);

  const getStageDate = (stageKey: string) => {
    const stage = STAGES.find(s => s.key === stageKey);
    const aliases = stage ? stage.aliases : [stageKey];
    const entry = history.find(h => aliases.includes(h.to_status));
    return entry ? new Date(entry.changed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
  };

  const isStageCompleted = (stageKey: string) => {
    const stageIdx = STAGES.findIndex(s => s.key === stageKey);
    const currentIdx = STAGES.findIndex(s => s.aliases.includes(currentStatus));
    
    if (TERMINAL_STAGES[currentStatus]) {
      // Find the last non-terminal stage reached
      const lastReached = [...history].reverse().find(h => !TERMINAL_STAGES[h.to_status]);
      if (!lastReached) return stageKey === 'applied';
      const lastIdx = STAGES.findIndex(s => s.aliases.includes(lastReached.to_status));
      return stageIdx <= lastIdx;
    }
    
    return stageIdx < currentIdx;
  };

  const isStageCurrent = (stageKey: string) => {
    const stage = STAGES.find(s => s.key === stageKey);
    return stage?.aliases.includes(currentStatus) || false;
  };

  const isTerminal = !!TERMINAL_STAGES[currentStatus];
  const terminalInfo = TERMINAL_STAGES[currentStatus];

  // Calculate progress bar width
  const calculateProgress = () => {
    if (isTerminal) {
       const lastReached = [...history].reverse().find(h => !TERMINAL_STAGES[h.to_status]);
       if (!lastReached) return 0;
       const idx = STAGES.findIndex(s => s.aliases.includes(lastReached.to_status));
       return (idx / (STAGES.length - 1)) * 100;
    }
    const currentIdx = STAGES.findIndex(s => s.aliases.includes(currentStatus));
    if (currentIdx === -1) return 0;
    return (currentIdx / (STAGES.length - 1)) * 100;
  };

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timeline}>
        <div className={styles.timelineTrack} />
        <div className={styles.timelineProgress} style={{ width: `${calculateProgress()}%` }} />
        
        {STAGES.map((stage) => {
          const completed = isStageCompleted(stage.key);
          const current = isStageCurrent(stage.key);
          const date = getStageDate(stage.key);
          
          return (
            <div key={stage.key} className={styles.stageNode}>
              <div className={`
                ${styles.nodeCircle} 
                ${completed ? styles.completed : ''} 
                ${current ? styles.current : ''}
                ${!completed && !current ? styles.pending : ''}
              `}>
                {stage.icon}
              </div>
              <div className={styles.stageInfo}>
                <div className={styles.stageLabel}>{stage.label}</div>
                <div className={styles.stageDate}>{date || 'Pending'}</div>
              </div>
            </div>
          );
        })}

        {isTerminal && (
           <div className={styles.stageNode}>
              <div className={`${styles.nodeCircle} ${terminalInfo.class}`}>
                {terminalInfo.icon}
              </div>
              <div className={styles.stageInfo}>
                <div className={styles.stageLabel}>{terminalInfo.label}</div>
                <div className={styles.stageDate}>{getStageDate(currentStatus)}</div>
              </div>
           </div>
        )}
      </div>

      {isTerminal && (
        <div style={{ 
          marginTop: '20px', padding: '12px 16px', borderRadius: '12px', 
          background: currentStatus === 'rejected' ? '#fff1f2' : '#f8fafc',
          color: currentStatus === 'rejected' ? '#e11d48' : '#475569',
          fontSize: '0.85rem', fontWeight: 500, border: '1px solid currentColor',
          opacity: 0.8
        }}>
          {currentStatus === 'rejected' ? "Your application was not selected for this role." : `You withdrew this application on ${getStageDate(currentStatus)}.`}
        </div>
      )}

      <div className={styles.logContainer}>
        <h3 className={styles.logTitle}>Activity Log</h3>
        <div className={styles.logList}>
          {history.map((entry) => (
            <div key={entry.id} className={styles.logItem}>
              <span className={styles.logBullet}>•</span>
              <span className={styles.logDate}>
                {new Date(entry.changed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {new Date(entry.changed_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={styles.logMessage}>
                — {FRIENDLY_MESSAGES[entry.to_status] || `Status updated to ${entry.to_status}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
