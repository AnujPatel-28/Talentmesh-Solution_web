'use client';

import React, { useState } from 'react';

const mockAnnouncements = [
  { id: '1', title: 'Platform Maintenance Scheduled', date: 'Oct 15, 2026', audience: 'All Users', status: 'published', excerpt: 'We will be performing scheduled maintenance on Oct 18 from 2AM to 4AM UTC.' },
  { id: '2', title: 'New AI Matching Engine Live', date: 'Oct 10, 2026', audience: 'Recruiters', status: 'published', excerpt: 'Our upgraded AI matching engine is now live for all Enterprise recruiters.' },
  { id: '3', title: 'Updated Privacy Policy', date: 'Oct 01, 2026', audience: 'All Users', status: 'draft', excerpt: 'Please review our updated privacy policy regarding data retention.' },
];

export default function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState('published');
  const filtered = mockAnnouncements.filter(a => a.status === activeTab);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Announcements & Broadcasts</h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Communicate platform updates, policy changes, and alerts to your users.</p>
        </div>
        <button style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Broadcast
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* Main Feed */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 1rem' }}>
            {['published', 'draft', 'scheduled'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '1.25rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: activeTab === tab ? '600' : '500',
                  color: activeTab === tab ? '#3b82f6' : '#64748b',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ padding: '0' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>No {activeTab} announcements.</div>
            ) : (
              filtered.map((item, idx) => (
                <div key={item.id} style={{ padding: '1.5rem', borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', gap: '1.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 15h2a2 2 0 1 0 0-4h-2" /><path d="m4 11 6-6v14l-6-6H2v-2h2z" /><path d="M19 12c0-2.5-1.5-4.5-4-5v10c2.5-.5 4-2.5 4-5z" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>{item.title}</h3>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.date}</span>
                    </div>
                    <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1rem' }}>{item.excerpt}</p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3b82f6', background: '#eff6ff', padding: '0.25rem 0.75rem', borderRadius: '999px' }}>Audience: {item.audience}</span>
                      <button style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '16px', padding: '1.5rem', color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reach Analytics</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: '700' }}>84%</span>
              <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>+12%</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Average open rate across all announcements in the last 30 days.</p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>Target Audiences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>All Users</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>14,230</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>Recruiters Only</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>2,450</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>Candidates Only</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>11,780</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
