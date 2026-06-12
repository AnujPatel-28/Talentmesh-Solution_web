'use client';
import React, { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants/application-status-map';
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
  { key: 'applied', label: APPLICATION_STATUS_LABELS.applied, icon: '📝' },
  { key: 'reviewing', label: APPLICATION_STATUS_LABELS.reviewing, icon: '🔍' },
  { key: 'shortlisted', label: APPLICATION_STATUS_LABELS.shortlisted, icon: '⭐' },
  { key: 'interviewing', label: APPLICATION_STATUS_LABELS.interviewing, icon: '🎙️' },
  { key: 'offered', label: APPLICATION_STATUS_LABELS.offered, icon: '📋' },
  { key: 'hired', label: APPLICATION_STATUS_LABELS.hired, icon: '🎉' },
];

const TERMINAL_STAGES: Record<string, { label: string, icon: string, class: string }> = {
  rejected: { label: APPLICATION_STATUS_LABELS.rejected, icon: '✕', class: styles.terminal },
  withdrawn: { label: APPLICATION_STATUS_LABELS.withdrawn, icon: '↩', class: styles.withdrawn },
};

const FRIENDLY_MESSAGES: Record<string, string> = {
  'applied': 'Application submitted',
  'reviewing': "Your application caught the recruiter's attention",
  'shortlisted': "Great news — you've been shortlisted!",
  'interviewing': "An interview has been scheduled",
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
    const entry = history.find(h => h.to_status === stageKey);
    return entry ? new Date(entry.changed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
  };

  const isStageCompleted = (stageKey: string) => {
    const stageIdx = STAGES.findIndex(s => s.key === stageKey);
    const currentIdx = STAGES.findIndex(s => s.key === currentStatus);
    
    if (TERMINAL_STAGES[currentStatus]) {
      // Find the last non-terminal stage reached
      const lastReached = [...history].reverse().find(h => !TERMINAL_STAGES[h.to_status]);
      if (!lastReached) return stageKey === 'applied';
      const lastIdx = STAGES.findIndex(s => s.key === lastReached.to_status);
      return stageIdx <= lastIdx;
    }
    
    return stageIdx < currentIdx;
  };

  const isStageCurrent = (stageKey: string) => {
    return stageKey === currentStatus;
  };

  const isTerminal = !!TERMINAL_STAGES[currentStatus];
  const terminalInfo = TERMINAL_STAGES[currentStatus];

  // Calculate progress bar width
  const calculateProgress = () => {
    if (isTerminal) {
       const lastReached = [...history].reverse().find(h => !TERMINAL_STAGES[h.to_status]);
       if (!lastReached) return 0;
       const idx = STAGES.findIndex(s => s.key === lastReached.to_status);
       return (idx / (STAGES.length - 1)) * 100;
    }
    const currentIdx = STAGES.findIndex(s => s.key === currentStatus);
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
