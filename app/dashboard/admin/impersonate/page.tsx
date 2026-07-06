'use client';

import React from 'react';

export default function ImpersonatePage() {
    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>User Impersonation</h1>
                <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Log in as any user to troubleshoot issues, guide them through workflows, or verify their account state securely.</p>
            </header>

            <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.5)', padding: '3rem', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
                <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    <input
                        type="text"
                        placeholder="Search by name, email, or user ID..."
                        style={{ width: '100%', padding: '1.5rem 1.5rem 1.5rem 4rem', fontSize: '1.1rem', background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '16px', outline: 'none', transition: 'border-color 0.2s', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)' }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <button style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>Search</button>
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1.5rem' }}>Recently Impersonated / Test Accounts</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>

                    {[
                        { name: 'John Doe', email: 'john@candidate.test', role: 'Candidate', initial: 'J' },
                        { name: 'Acme Recruiter', email: 'hr@acme.test', role: 'Recruiter', initial: 'A' },
                        { name: 'Jane Smith', email: 'jane@candidate.test', role: 'Candidate', initial: 'J' }
                    ].map((user, idx) => (
                        <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: user.role === 'Candidate' ? '#eff6ff' : '#f0fdf4', color: user.role === 'Candidate' ? '#3b82f6' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                                    {user.initial}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{user.name}</h4>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.email}</span>
                                </div>
                            </div>
                            <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem', borderRadius: '8px', color: '#475569', cursor: 'pointer' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                            </button>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
}
