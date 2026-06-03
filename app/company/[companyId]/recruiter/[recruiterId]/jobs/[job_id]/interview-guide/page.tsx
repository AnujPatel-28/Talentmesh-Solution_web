"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './guide.module.css';
import { insforge, invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  InterviewGuideResponse, 
  InterviewGuideRecord,
  QuestionType,
  DifficultyLevel 
} from '@/types/recruiter';

const IC = {
  chevronLeft: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>,
  chevronRight: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>,
  sparkles: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3l1.912 5.813h6.112l-4.944 3.593 1.888 5.794-4.968-3.612-4.968 3.612 1.888-5.794-4.944-3.593h6.112z" /></svg>,
  loading: <svg className={styles.spin} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>,
  chevronDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>,
  warning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  print: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
};

const INTERVIEW_TYPES = [
  { id: 'technical', name: 'Technical', icon: '🔧', desc: 'Focus on coding, system design, technical skills' },
  { id: 'behavioral', name: 'Behavioral', icon: '🧠', desc: 'STAR method, past experience, soft skills' },
  { id: 'cultural', name: 'Cultural Fit', icon: '🏢', desc: 'Values, team dynamics, work style' },
  { id: 'comprehensive', name: 'Comprehensive', icon: '📋', desc: 'Full 60-90 min guide covering all areas' },
];

const DURATIONS = [30, 45, 60, 90];
const DIFFICULTIES = ['Entry', 'Mid', 'Senior', 'Lead'];

export default function InterviewGuidePage() {
  const { job_id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [job, setJob] = useState<any>(null);
  const [prevGuides, setPrevGuides] = useState<InterviewGuideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Generation State
  const [step, setStep] = useState<'config' | 'generating' | 'display'>('config');
  const [selectedType, setSelectedType] = useState('technical');
  const [selectedDuration, setSelectedDuration] = useState(45);
  const [selectedDifficulty, setSelectedDifficulty] = useState('Mid');
  const [error, setError] = useState<string | null>(null);
  
  // Result State
  const [guide, setGuide] = useState<InterviewGuideResponse | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobRes, guidesRes] = await Promise.all([
          insforge.database.from('jobs').select('*').eq('id', job_id).single(),
          insforge.database.from('interview_guides').select('*').eq('job_id', job_id).order('created_at', { ascending: false })
        ]);

        if (jobRes.data) setJob(jobRes.data);
        if (guidesRes.data) setPrevGuides(guidesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (job_id) fetchData();
  }, [job_id]);

  const handleGenerate = async () => {
    setStep('generating');
    setError(null);
    
    try {
      const { data, error: invokeError } = await invokeFunction('interview-generator', {
        body: {
          job_id: job_id,
          job_title: job.title,
          job_description: job.description,
          required_skills: job.skills_required,
          experience_level: selectedDifficulty,
          interview_type: selectedType,
          duration: selectedDuration
        }
      });

      if (invokeError) throw new Error(invokeError.message);
      if (!data) throw new Error('No data received from generator');

      setGuide(data);
      setStep('display');

      // Save to DB
      if (user?.id) {
        await insforge.database.from('interview_guides').insert({
          job_id: job_id,
          recruiter_id: user.id,
          interview_type: selectedType,
          duration_minutes: selectedDuration,
          guide_data: data
        });
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Guide generation failed. Please try again.');
      setStep('config');
    }
  };

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handlePrint = () => window.print();

  const handleCopy = () => {
    if (!guide) return;
    const text = JSON.stringify(guide, null, 2);
    navigator.clipboard.writeText(text);
    alert('Guide data copied to clipboard (JSON format)');
  };

  const loadGuide = (g: InterviewGuideRecord) => {
    setGuide(g.guide_data);
    setSelectedType(g.interview_type);
    setSelectedDuration(g.duration_minutes);
    setStep('display');
  };

  if (loading) return <div className={styles.container}>Loading job data...</div>;
  if (!job) return <div className={styles.container}>Job not found</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href={`/recruiter/jobs/${job_id}`} className={styles.backBtn}>
          {IC.chevronLeft} Back to Job Details
        </Link>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Interview Guide</h1>
          <span className={styles.auraBadge}>✦ Aura AI</span>
        </div>
        <p className={styles.subtitle}>Generating custom interview path for <strong>{job.title}</strong></p>
      </header>

      {/* Previous Guides List */}
      {step === 'config' && prevGuides.length > 0 && (
        <div className={styles.configSection} style={{ marginBottom: '3rem' }}>
          <h3 className={styles.sectionTitle}>Previously generated guides</h3>
          <div className={styles.selectorRow}>
            {prevGuides.map(g => (
              <button key={g.id} className={styles.selectItem} onClick={() => loadGuide(g)}>
                {new Date(g.created_at).toLocaleDateString()} — {g.interview_type} ({g.duration_minutes}m)
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className={styles.configCard} style={{ borderColor: '#ef4444', marginBottom: '2rem', background: '#fef2f2' }}>
          <div style={{ display: 'flex', gap: '0.75rem', color: '#b91c1c' }}>
            {IC.warning}
            <div>
              <h4 style={{ fontWeight: 700 }}>Guide generation failed</h4>
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{error}</p>
              <button 
                onClick={() => handleGenerate()} 
                className={styles.ghostBtn} 
                style={{ marginTop: '1rem', background: '#fff', borderColor: '#fecaca' }}
              >
                Try Again
              </button>
              <a 
                href="https://www.interviewbit.com" 
                target="_blank" 
                className={styles.viewFullLink} 
                style={{ marginTop: '1rem', color: '#b91c1c' }}
              >
                Go to generic question bank {IC.chevronRight}
              </a>
            </div>
          </div>
        </div>
      )}

      {step === 'config' && (
        <div className={styles.configCard}>
          <div className={styles.configSection}>
            <h3 className={styles.sectionTitle}>1. Choose Interview Type</h3>
            <div className={styles.typeGrid}>
              {INTERVIEW_TYPES.map(t => (
                <div 
                  key={t.id} 
                  className={`${styles.typeCard} ${selectedType === t.id ? styles.typeCardActive : ''}`}
                  onClick={() => setSelectedType(t.id)}
                >
                  <span className={styles.typeIcon}>{t.icon}</span>
                  <span className={styles.typeName}>{t.name}</span>
                  <span className={styles.typeDesc}>{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.configSection}>
            <h3 className={styles.sectionTitle}>2. Duration & Difficulty</h3>
            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <label className={styles.sectionTitle} style={{ fontSize: '0.85rem', color: '#64748b' }}>Estimated Time</label>
                <div className={styles.selectorRow}>
                  {DURATIONS.map(d => (
                    <button 
                      key={d} 
                      className={`${styles.selectItem} ${selectedDuration === d ? styles.selectItemActive : ''}`}
                      onClick={() => setSelectedDuration(d)}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={styles.sectionTitle} style={{ fontSize: '0.85rem', color: '#64748b' }}>Candidate Level</label>
                <div className={styles.selectorRow}>
                  {DIFFICULTIES.map(d => (
                    <button 
                      key={d} 
                      className={`${styles.selectItem} ${selectedDifficulty === d ? styles.selectItemActive : ''}`}
                      onClick={() => setSelectedDifficulty(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button className={styles.generateBtn} onClick={handleGenerate}>
            {IC.sparkles} Generate Interview Guide
          </button>
        </div>
      )}

      {step === 'generating' && (
        <div className={styles.loadingContainer}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', width: '100%' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={styles.sectionCard} style={{ opacity: 0.5 }}>
                <div className={styles.skeleton} style={{ height: '24px', width: '60%', marginBottom: '1.5rem' }} />
                <div className={styles.skeleton} style={{ height: '100px', width: '100%' }} />
              </div>
            ))}
          </div>
          <div className={styles.loadingText}>Aura AI is crafting your interview guide...</div>
          <div className={styles.loadingSub}>Usually takes 8-15 seconds</div>
        </div>
      )}

      {step === 'display' && guide && (
        <>
          <div className={styles.guideHeader}>
            <div className={styles.guideMeta}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{guide.job_title}</h2>
              <span className={styles.badge}>{selectedType.toUpperCase()}</span>
              <span className={styles.badge}>{guide.estimated_duration} MIN</span>
            </div>
            <div className={styles.actionRow}>
              <button className={styles.ghostBtn} onClick={() => setStep('config')}>{IC.refresh} Regenerate</button>
              <button className={styles.ghostBtn} onClick={handlePrint}>{IC.print} Print</button>
              <button className={styles.ghostBtn} onClick={handleCopy}>{IC.copy} Copy All</button>
            </div>
          </div>

          {guide.sections?.map((section, sIdx) => (
            <div key={sIdx} className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
                <span className={styles.badge}>{section.duration_minutes} MIN</span>
              </div>

              <div className={styles.questionList}>
                {section.questions?.map((q, qIdx) => (
                  <div key={q.id || qIdx} className={`${styles.questionBlock} ${styles['q_' + q.type]}`}>
                    <div className={styles.qHead}>
                      <span className={styles.qNum}>Question {qIdx + 1}</span>
                      <span className={`${styles.difficulty} ${styles['diff_' + q.difficulty]}`}>
                        {q.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.qText}>{q.question}</div>

                    <div className={styles.collapsible}>
                      <button className={styles.collapseToggle} onClick={() => toggleQuestion(q.id || `q-${sIdx}-${qIdx}`)}>
                        <span>Details & Rubric</span>
                        <span className={`${styles.chevron} ${expandedQuestions[q.id || `q-${sIdx}-${qIdx}`] ? styles.chevronActive : ''}`}>
                          {IC.chevronDown}
                        </span>
                      </button>
                      <div className={`${styles.collapseContent} ${expandedQuestions[q.id || `q-${sIdx}-${qIdx}`] ? styles.collapseContentActive : ''}`}>
                        <div className={styles.collapseInner}>
                          <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Expected Answer Points:</strong>
                            <ul className={styles.pointsList}>
                              {q.expected_answer_points?.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Follow-up:</strong>
                            <p>{q.follow_up}</p>
                          </div>
                          <div>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Scoring Rubric:</strong>
                            <p>{q.scoring_rubric}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className={styles.criteriaGrid}>
            <div className={styles.criteriaCard}>
              <h4 className={styles.sectionTitle}>What to evaluate</h4>
              <ul className={styles.pointsList} style={{ marginLeft: 0 }}>
                {guide.evaluation_criteria?.map((c, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.5rem', listStyle: 'none' }}>
                    <input type="checkbox" readOnly />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {guide.red_flags?.length > 0 && (
              <div className={`${styles.criteriaCard} ${styles.redFlagsCard}`}>
                <h4 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {IC.warning} Watch Out For
                </h4>
                <div className={styles.flagsList}>
                  {guide.red_flags.map((f, i) => <span key={i} className={styles.flagPill}>{f}</span>)}
                </div>
              </div>
            )}
          </div>

          <div className={styles.structureCard}>
            <h4 className={styles.sectionTitle} style={{ fontStyle: 'normal' }}>Recommended Structure</h4>
            {guide.recommended_structure}
          </div>

          <div className={styles.footerActions}>
            <button className={styles.useBtn} onClick={() => router.push('/recruiter/interviews')}>
              Use This Guide
            </button>
          </div>
        </>
      )}
    </div>
  );
}
