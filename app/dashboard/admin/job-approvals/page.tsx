'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { invokeFunction } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';

type AdminJob = {
  id: string;
  title: string;
  status: string;
  is_approved: boolean;
  created_at: string;
  companies?: {
    name?: string | null;
  };
};

export default function JobApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeFunction('admin-jobs', {
        method: 'GET',
        queries: { status: activeTab, page: '0', limit: '100' }
      });
      if (!error && data) {
        setJobs(data.jobs || data.items || []);
      }
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [fetchJobs, user]);

  const handleAction = async (id: string, is_approved: boolean) => {
    try {
      // Use the standard bulk action format which is supported by admin-jobs
      await invokeFunction('admin-jobs', {
        method: 'POST',
        body: { ids: [id], action: 'bulk-update', updates: { is_approved, status: is_approved ? 'active' : 'rejected' } }
      });
      fetchJobs();
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Job Approvals</h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Review and manage incoming job postings before they go live on the platform.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Loaded</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e3a8a' }}>{jobs.length}</span>
          </div>
        </div>
      </header>

      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', overflow: 'hidden' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 1rem' }}>
          {['pending', 'active', 'rejected'].map(tab => (
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
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {tab === 'active' ? 'Approved' : tab} Postings
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Title</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Loading...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No {activeTab} jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#0f172a', display: 'block' }}>{job.title}</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>ID: JOB-{(job.id || '').substring(0,6)}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontWeight: '500' }}>{job.companies?.name || 'Unknown'}</td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{new Date(job.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      {activeTab === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleAction(job.id, true)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>Approve</button>
                          <button onClick={() => handleAction(job.id, false)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>Reject</button>
                        </div>
                      ) : (
                        <button style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: '500', color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}>View Details</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
