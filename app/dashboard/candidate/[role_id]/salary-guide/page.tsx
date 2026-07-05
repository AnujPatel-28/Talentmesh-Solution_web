"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const INDUSTRIES = ['All Industries', 'Technology', 'Healthcare', 'Finance', 'Marketing', 'Education', 'Operations'];

const ALL_SALARIES = [
    { role: 'Software Engineer', avg: '₹8,81,381 per year', industry: 'Technology', link: '→' },
    { role: 'Registered Nurse', avg: '₹2,37,138 per year', industry: 'Healthcare', link: '→' },
    { role: 'Accountant', avg: '₹2,68,399 per year', industry: 'Finance', link: '→' },
    { role: 'Business Analyst', avg: '₹8,97,732 per year', industry: 'Technology', link: '→' },
    { role: 'Nursing Assistant', avg: '₹2,84,577 per year', industry: 'Healthcare', link: '→' },
    { role: 'Sales Executive', avg: '₹2,62,113 per year', industry: 'Marketing', link: '→' },
    { role: 'Data Scientist', avg: '₹12,45,000 per year', industry: 'Technology', link: '→' },
    { role: 'Product Manager', avg: '₹15,50,000 per year', industry: 'Technology', link: '→' },
    { role: 'UX Designer', avg: '₹9,50,000 per year', industry: 'Technology', link: '→' },
    { role: 'Marketing Manager', avg: '₹8,00,000 per year', industry: 'Marketing', link: '→' },
    { role: 'Financial Analyst', avg: '₹7,80,000 per year', industry: 'Finance', link: '→' },
    { role: 'HR Manager', avg: '₹6,50,000 per year', industry: 'Operations', link: '→' },
    { role: 'Teacher', avg: '₹3,60,000 per year', industry: 'Education', link: '→' },
    { role: 'DevOps Engineer', avg: '₹11,00,000 per year', industry: 'Technology', link: '→' },
    { role: 'Operations Manager', avg: '₹9,20,000 per year', industry: 'Operations', link: '→' },
];

export default function SalaryGuidePage() {
    const params = useParams();
    const router = useRouter();
    const roleId = params.role_id as string;

    const [what, setWhat] = useState('');
    const [where, setWhere] = useState('India');
    const [industry, setIndustry] = useState('All Industries');
    const [selectedRole, setSelectedRole] = useState<any | null>(null);

    const visible = ALL_SALARIES.filter(s => {
        const matchesIndustry = industry === 'All Industries' || s.industry === industry;
        const matchesWhat = !what || s.role.toLowerCase().includes(what.toLowerCase());
        return matchesIndustry && matchesWhat;
    });

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* ─── Dark Navy Hero ─── */}
            <div style={{
                background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
                padding: '3.5rem 2rem 6rem',
                textAlign: 'center',
                position: 'relative',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'visible'
            }}>
                {/* Decorative graphic blob */}
                <div style={{
                    position: 'absolute',
                    right: '8%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '180px',
                    height: '180px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                </div>

                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    Discover your earning potential
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', margin: '0', maxWidth: '480px' }}>
                    Explore high-paying careers, salaries and job openings by industry and location.
                </p>

                {/* ─── Two-input search card overlapping hero bottom (Pill style) ─── */}
                <div style={{
                    position: 'absolute',
                    bottom: '-28px',
                    width: 'calc(100% - 4rem)',
                    maxWidth: '780px',
                    background: '#ffffff',
                    border: '1px solid #CBD2DB',
                    borderRadius: '9999px',
                    padding: '6px 6px 6px 20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 10,
                    boxSizing: 'border-box'
                }}>
                    {/* "What" input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Job title or keywords"
                            value={what}
                            onChange={e => setWhat(e.target.value)}
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px', color: '#12263A', background: 'transparent', height: '36px' }}
                        />
                    </div>

                    {/* Vertical Divider */}
                    <div style={{ width: '1px', height: '24px', background: '#E2E5EA', margin: '0 16px' }} />

                    {/* "Where" input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="City, state, or country"
                            value={where}
                            onChange={e => setWhere(e.target.value)}
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px', color: '#12263A', background: 'transparent', height: '36px' }}
                        />
                        {where && (
                            <button
                                onClick={() => setWhere('')}
                                style={{ background: '#E2E8F0', border: 'none', cursor: 'pointer', color: '#64748b', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Search button */}
                    <button
                        style={{
                            backgroundColor: '#007BFF',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '9999px',
                            padding: '0 28px',
                            height: '44px',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'background 0.15s'
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = '#006AE6')}
                        onMouseOut={e => (e.currentTarget.style.background = '#007BFF')}
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* ─── Content Below Hero ─── */}
            <div style={{ maxWidth: '960px', margin: '5rem auto 3rem', padding: '0 2rem' }}>

                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#12263A', marginBottom: '0.25rem' }}>
                    Browse top-paying jobs by industry
                </h2>

                {/* Industry Filter Bar */}
                <div style={{ margin: '1rem 0 2rem', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>Choose an industry</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={industry}
                            onChange={e => setIndustry(e.target.value)}
                            style={{
                                border: '1px solid #CBD2DB',
                                borderRadius: '8px',
                                padding: '8px 36px 8px 14px',
                                fontSize: '14px',
                                color: '#12263A',
                                background: '#ffffff',
                                cursor: 'pointer',
                                outline: 'none',
                                appearance: 'none',
                                minWidth: '200px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                fontFamily: 'Inter, system-ui, sans-serif',
                                transition: 'border-color 0.15s'
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = '#007BFF'}
                            onBlur={e => e.currentTarget.style.borderColor = '#CBD2DB'}
                        >
                            {INDUSTRIES.map(ind => (
                                <option key={ind} value={ind}>{ind}</option>
                            ))}
                        </select>
                        <svg style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                </div>

                {/* Salary Cards Floating Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                    {visible.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', padding: '4rem 2rem', textAlign: 'center', color: '#6B7280', fontSize: '15px', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                            No results found. Try a different industry or keyword.
                        </div>
                    ) : (
                        visible.map((s, idx) => {
                            return (
                                <div
                                    key={s.role + idx}
                                    onClick={() => setSelectedRole(s)}
                                    style={{
                                        padding: '1.5rem',
                                        background: '#ffffff',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.borderColor = '#3B82F6';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.06)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#007BFF', background: '#EFF6FF', padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {s.industry}
                                        </span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5">
                                            <path d="M5 12h14m-7-7 7 7-7 7" />
                                        </svg>
                                    </div>
                                    <h3 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: '#12263A', letterSpacing: '-0.01em' }}>{s.role}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '13px', color: '#6B7280' }}>Average salary</span>
                                        <span style={{ fontSize: '15px', color: '#007BFF', fontWeight: 700 }}>
                                            {s.avg.split(' ')[0]} <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 400 }}>/ year</span>
                                        </span>
                                    </div>
                                    <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Link
                                            href={`/dashboard/candidate/${roleId}?search=${encodeURIComponent(s.role)}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            style={{ fontSize: '13px', color: '#007BFF', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            Job openings
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer note */}
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1.5rem', textAlign: 'center' }}>
                    Salary data based on self-reported salaries from TalentMesh users and public data sources.
                </p>
            </div>

            {/* ─── Salary Detail Modal ─── */}
            {selectedRole && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(12, 24, 37, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    backdropFilter: 'blur(4px)',
                }} onClick={() => setSelectedRole(null)}>
                    <style>{`
                        @keyframes modalFadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes modalSlideUp {
                            from { transform: translateY(20px); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                        .modal-overlay {
                            animation: modalFadeIn 0.2s ease-out;
                        }
                        .modal-box {
                            animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                        }
                    `}</style>
                    <div className="modal-box" style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '500px',
                        padding: '2.5rem',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        boxSizing: 'border-box',
                        fontFamily: 'Inter, system-ui, sans-serif'
                    }} onClick={e => e.stopPropagation()}>
                        
                        {/* Close button */}
                        <button 
                            onClick={() => setSelectedRole(null)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: '#f1f5f9',
                                border: 'none',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#475569',
                                fontSize: '14px',
                                transition: 'all 0.15s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                            onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
                        >
                            ✕
                        </button>

                        <div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#007BFF', background: '#EFF6FF', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {selectedRole.industry}
                            </span>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#12263A', margin: '8px 0 2px', letterSpacing: '-0.01em' }}>
                                {selectedRole.role}
                            </h2>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>Salary Guide & Market Insights</p>
                        </div>

                        {/* Salary highlight */}
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e5ea', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Average Base Salary</span>
                            <span style={{ fontSize: '28px', fontWeight: 800, color: '#007BFF' }}>{selectedRole.avg}</span>
                        </div>

                        {/* Salary Distribution chart */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>
                                <span>Low: ₹3.2L</span>
                                <span style={{ color: '#007BFF' }}>Average: {selectedRole.avg.split(' ')[0]}</span>
                                <span>High: ₹18.5L</span>
                            </div>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ height: '100%', width: '48%', background: 'linear-gradient(90deg, #93C5FD 0%, #3B82F6 100%)', borderRadius: '9999px' }} />
                            </div>
                        </div>

                        {/* Benefits breakdown */}
                        <div>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#12263A', margin: '0 0 8px' }}>Common Benefits for this role</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {['Health Insurance', 'Paid Sick Leave', 'Flexible Schedule', 'Performance Bonus'].map(b => (
                                    <span key={b} style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e5ea' }}>
                                        {b}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* CTA button */}
                        <button
                            onClick={() => {
                                router.push(`/dashboard/candidate/${roleId}?search=${encodeURIComponent(selectedRole.role)}`);
                            }}
                            style={{
                                background: '#007BFF',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                textAlign: 'center',
                                marginTop: '4px'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#006AE6'}
                            onMouseOut={e => e.currentTarget.style.background = '#007BFF'}
                        >
                            View Job Openings for {selectedRole.role}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
