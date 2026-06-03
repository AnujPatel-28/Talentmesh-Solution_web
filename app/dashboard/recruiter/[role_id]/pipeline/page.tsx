"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { invokeFunction } from '@/lib/insforge';
import { HomeSkeleton } from '@/components/ui/DashboardSkeleton';
import styles from './pipeline.module.css';

const STAGES = [
    { id: 'applied',     label: 'Applied',    color: '#3b82f6', bg: '#eff6ff' },
    { id: 'screening',   label: 'Screening',  color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 'interview',   label: 'Interview',  color: '#f59e0b', bg: '#fffbeb' },
    { id: 'offer',       label: 'Offer',      color: '#10b981', bg: '#f0fdf4' },
    { id: 'hired',       label: 'Hired',      color: '#059669', bg: '#ecfdf5' },
    { id: 'rejected',    label: 'Rejected',   color: '#ef4444', bg: '#fff1f2' },
] as const;

type Stage = typeof STAGES[number]['id'];
type Card = { id: string; name: string; role: string; job: string; avatar: string; stage: Stage };

export default function HiringPipelinePage() {
    const { user } = useAuth();
    const [pipeline, setPipeline] = useState<Record<Stage, Card[]>>({
        applied: [], screening: [], interview: [], offer: [], hired: [], rejected: [],
    });
    const [loading, setLoading] = useState(true);
    const dragging = useRef<{ card: Card; fromStage: Stage } | null>(null);

    useEffect(() => {
        if (!user?.id) return;
        const load = async () => {
            const { data } = await invokeFunction('recruiter-dashboard');
            if (data?.pipeline) {
                const grouped: any = { applied: [], screening: [], interview: [], offer: [], hired: [], rejected: [] };
                (data.pipeline as any[]).forEach((item: any) => {
                    const stageKey = item.stage?.toLowerCase() as Stage;
                    if (grouped[stageKey]) {
                        grouped[stageKey].push({
                            id: item.id || Math.random().toString(),
                            name: item.name || item.candidate_name || 'Candidate',
                            role: item.role || item.job_title || '—',
                            job: item.job || item.job_name || '—',
                            avatar: (item.name || 'C').split(' ').map((n: string) => n[0]).join(''),
                            stage: stageKey,
                        });
                    }
                });
                setPipeline(grouped);
            }
            setLoading(false);
        };
        load();
    }, [user?.id]);

    const handleDragStart = (card: Card, fromStage: Stage) => {
        dragging.current = { card, fromStage };
    };

    const handleDrop = (toStage: Stage) => {
        if (!dragging.current) return;
        const { card, fromStage } = dragging.current;
        if (fromStage === toStage) return;

        setPipeline(prev => ({
            ...prev,
            [fromStage]: prev[fromStage].filter(c => c.id !== card.id),
            [toStage]: [...prev[toStage], { ...card, stage: toStage }],
        }));
        dragging.current = null;
    };

    if (loading) return <HomeSkeleton />;

    const total = Object.values(pipeline).flat().length;

    return (
        <div className={styles.pipelineWrapper}>
            <div className={styles.pipelineHeader}>
                <h1 className={styles.pageTitle}>Hiring Pipeline</h1>
                <p className={styles.pageSub}>{total} candidates across all stages · drag cards to move them</p>
            </div>

            <div className={styles.kanbanScroll}>
                {STAGES.map(stage => {
                    const cards = pipeline[stage.id] || [];
                    return (
                        <div
                            key={stage.id}
                            onDragOver={e => e.preventDefault()}
                            onDrop={() => handleDrop(stage.id)}
                            className={styles.stageCol}
                        >
                            {/* Column header */}
                            <div 
                                className={styles.stageHeader} 
                                style={{ 
                                    background: stage.bg, 
                                    borderBottomColor: stage.color 
                                }}
                            >
                                <span className={styles.stageLabel} style={{ color: stage.color }}>{stage.label}</span>
                                <span className={styles.stageBadge} style={{ background: stage.color }}>{cards.length}</span>
                            </div>

                            {/* Cards */}
                            <div className={styles.stageBody}>
                                {cards.length === 0 && (
                                    <div className={styles.emptyHint}>Drop here</div>
                                )}
                                {cards.map(card => (
                                    <div
                                        key={card.id}
                                        draggable
                                        onDragStart={() => handleDragStart(card, stage.id)}
                                        className={styles.candCard}
                                    >
                                        <div className={styles.cardHead}>
                                            <div className={styles.avatar} style={{ background: stage.color }}>
                                                {card.avatar}
                                            </div>
                                            <div className={styles.metaInfo}>
                                                <div className={styles.name}>{card.name}</div>
                                                <div className={styles.role}>{card.role}</div>
                                            </div>
                                        </div>
                                        {card.job && (
                                            <div className={styles.jobLabel}>
                                                {card.job}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
