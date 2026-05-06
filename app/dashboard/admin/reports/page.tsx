'use client';

import { useEffect, useState } from 'react';
import styles from './reports.module.css';
import { invokeFunction } from '@/lib/insforge';


type ReportsData = {
  metrics: {
    totalJobs: number;
    totalApplications: number;
    totalCandidates: number;
    totalRecruiters: number;
    avgTimeToHire: string;
    appsPerJob: number;
  };
  funnel: {
    jobsPosted: number;
    applications: number;
    reviewed: number;
    shortlisted: number;
    hired: number;
  };
  growth: Array<{ date: string; count: number }>;
  topSkills: Array<{ name: string; count: number }>;
  statusBreakdown: Record<string, number>;
};

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReports() {
      try {
        const { data, error: fetchError } = await invokeFunction('admin-dashboard', {
          method: 'POST',
          body: { action: 'get-reports' }
        });

        
        if (fetchError) throw new Error(fetchError.message);
        
        if (data) {
          setData(data);
        }
      } catch (err) {
        setError('Failed to load platform analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) return <div className={styles.emptyState}>Synthesizing professional intelligence...</div>;
  if (!data) return <div className={styles.emptyState}>Platform data is currently unavailable.</div>;

  const funnelMax = data.funnel.jobsPosted || 1;
  const growthMax = Math.max(...data.growth.map(g => g.count), 1);
  const skillsMax = Math.max(...data.topSkills.map(s => s.count), 1);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Platform Insights</p>
          <h1 className={styles.title}>Professional Ecosystem Analytics</h1>
          <p className={styles.subtitle}>Audit platform velocity, engagement trends, and ecosystem equilibrium.</p>
        </div>
        <button className={styles.primaryButton} onClick={() => window.print()}>Export Executive Summary</button>
      </header>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Platform Velocity</span>
          <div className={styles.metricValue}>{data.metrics.totalApplications}</div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>+12% vs last month</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Hiring Friction</span>
          <div className={styles.metricValue}>{data.metrics.avgTimeToHire}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Network Average</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Intent Density</span>
          <div className={styles.metricValue}>{data.metrics.appsPerJob.toFixed(1)}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Apps per listing</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Network Scale</span>
          <div className={styles.metricValue}>{data.metrics.totalCandidates + data.metrics.totalRecruiters}</div>
          <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Active Entities</span>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        {/* Hiring Funnel (Manual CSS/SVG bars) */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Hiring Funnel <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Conversion Optimization</span></h3>
          <div className={styles.funnelWrapper}>
            {[
              { label: 'Jobs Posted', value: data.funnel.jobsPosted, color: '#1e293b' },
              { label: 'Total Intent', value: data.funnel.applications, color: '#334155' },
              { label: 'Audit Stage', value: data.funnel.reviewed, color: '#3b82f6' },
              { label: 'Candidate Shortlist', value: data.funnel.shortlisted, color: '#60a5fa' },
              { label: 'Placement Secured', value: data.funnel.hired, color: '#10b981' },
            ].map((step, i) => {
              const width = (step.value / funnelMax) * 100;
              return (
                <div key={i} className={styles.funnelStep} style={{ width: `${Math.max(width, 20)}%`, background: step.color }}>
                  <span className={styles.funnelLabel}>{step.label}</span>
                  <span>{step.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Growth Trend (Hand-coded SVG) */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Candidate Onboarding <span style={{ fontSize: '0.7rem', color: '#64748b' }}>4-Week Trajectory</span></h3>
          <div className={styles.chartContainer}>
            <svg viewBox="0 0 400 200" width="100%" height="100%">
              {/* Grid Lines */}
              <line x1="40" y1="180" x2="360" y2="180" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="40" y1="130" x2="360" y2="130" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="80" x2="360" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="30" x2="360" y2="30" stroke="#f1f5f9" strokeWidth="1" />

              {/* Data Line */}
              <path
                d={`M ${data.growth.map((g, i) => {
                  const x = 40 + (i * (320 / (data.growth.length - 1)));
                  const y = 180 - (g.count / growthMax) * 150;
                  return `${i === 0 ? '' : 'L'} ${x} ${y}`;
                }).join(' ')}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Area under line */}
              <path
                d={`M 40 180 ${data.growth.map((g, i) => {
                  const x = 40 + (i * (320 / (data.growth.length - 1)));
                  const y = 180 - (g.count / growthMax) * 150;
                  return `L ${x} ${y}`;
                }).join(' ')} L 360 180 Z`}
                fill="url(#growthGradient)"
                opacity="0.1"
              />

              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>

              {/* Data Points */}
              {data.growth.map((g, i) => {
                const x = 40 + (i * (320 / (data.growth.length - 1)));
                const y = 180 - (g.count / growthMax) * 150;
                return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />;
              })}

              {/* X Axis Labels */}
              {data.growth.map((g, i) => (
                <text key={i} x={40 + (i * (320 / (data.growth.length - 1)))} y="195" textAnchor="middle" fontSize="10" fill="#94a3b8">
                  {g.date}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Skill distribution */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Skill Demand Heatmap <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Candidate Proficiencies</span></h3>
          <div>
            {data.topSkills.map((skill, i) => (
              <div key={i} className={styles.skillBar}>
                <span className={styles.skillName}>{skill.name}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${(skill.count / skillsMax) * 100}%`, opacity: 1 - (i * 0.15) }} />
                </div>
                <span className={styles.skillCount}>{skill.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution (Custom Pie as CSS) */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Application Lifecycle <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Stage Distribution</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%', alignItems: 'center' }}>
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'conic-gradient(#3b82f6 0% 30%, #10b981 30% 55%, #f59e0b 55% 75%, #ef4444 75% 100%)', boxShadow: 'inset 0 0 0 30px white, 0 0 20px rgba(0,0,0,0.1)' }} />
            <div style={{ fontSize: '0.8rem', display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} /> Applied ({data.statusBreakdown.applied})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Shortlisted ({data.statusBreakdown.shortlisted})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> Interview ({data.statusBreakdown.interview})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> Rejected ({data.statusBreakdown.rejected})</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
