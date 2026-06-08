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
  description: string;
  requirements?: string[] | null;
  skills_required?: string[] | null;
  type?: string | null;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  experience_min?: number | null;
  experience_max?: number | null;
  department?: string | null;
  companies?: {
    name?: string | null;
    logo_url?: string | null;
    about?: string | null;
  } | null;
};

export default function JobApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Job Approvals Queue</h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Review and verify submitted job postings before they go live on the platform.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total In Stage</span>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e3a8a' }}>{jobs.length}</span>
          </div>
        </div>
      </header>

      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 1.5rem' }}>
          {['pending', 'active', 'rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1.25rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: activeTab === tab ? '700' : '500',
                color: activeTab === tab ? '#2563eb' : '#64748b',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #2563eb' : '3px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
                marginRight: '0.5rem'
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
                <th style={{ padding: '1.1rem 1.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Title</th>
                <th style={{ padding: '1.1rem 1.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</th>
                <th style={{ padding: '1.1rem 1.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted</th>
                <th style={{ padding: '1.1rem 1.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>
                    Fetching listings queue...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>
                    No {activeTab} job postings found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer' }} 
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} 
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setSelectedJob(job)}
                  >
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ fontWeight: '700', color: '#0f172a', display: 'block', fontSize: '0.95rem' }}>{job.title}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>ID: JOB-{(job.id || '').substring(0,6).toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#334155', fontWeight: '600', fontSize: '0.9rem' }}>{job.companies?.name || 'Unknown'}</td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{new Date(job.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button 
                          onClick={() => setSelectedJob(job)} 
                          style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', fontWeight: '600', color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          View Details
                        </button>
                        {activeTab === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleAction(job.id, true)} 
                              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', fontWeight: '600', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleAction(job.id, false)} 
                              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', fontWeight: '600', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedJob && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '2rem'
          }} 
          onClick={() => setSelectedJob(null)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '750px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Review Details</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0.2rem 0 0 0', letterSpacing: '-0.02em' }}>{selectedJob.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Metadata Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Company</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>{selectedJob.companies?.name || 'Unknown'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Location</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155' }}>{selectedJob.location || 'Remote'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Job Type</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155', textTransform: 'capitalize' }}>{selectedJob.type || 'Full-time'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Department</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155' }}>{selectedJob.department || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Salary Range</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155' }}>
                    {selectedJob.salary_min || selectedJob.salary_max 
                      ? `${selectedJob.currency || 'INR'} ${selectedJob.salary_min?.toLocaleString() || 0} - ${selectedJob.salary_max?.toLocaleString() || 'Max'}` 
                      : 'Competitive'}
                  </span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Experience Required</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155' }}>
                    {selectedJob.experience_min !== undefined && selectedJob.experience_min !== null 
                      ? `${selectedJob.experience_min} - ${selectedJob.experience_max || '5+'} Years` 
                      : 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Skills Tags */}
              {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: '700' }}>Skills Required</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedJob.skills_required.map((skill, index) => (
                      <span key={index} style={{ background: '#eff6ff', color: '#2563eb', padding: '0.35rem 0.75rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #bfdbfe' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements List */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: '700' }}>Requirements</h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index} style={{ marginBottom: '0.25rem' }}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Description */}
              <div>
                <h3 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: '700' }}>Description</h3>
                <div style={{
                  fontSize: '0.925rem',
                  lineHeight: '1.7',
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                  background: '#f8fafc',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}>
                  {selectedJob.description}
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              background: '#f8fafc'
            }}>
              <button 
                onClick={() => setSelectedJob(null)}
                style={{
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: '#475569',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Dismiss
              </button>
              
              {activeTab === 'pending' || !selectedJob.is_approved ? (
                <>
                  <button 
                    onClick={async () => {
                      await handleAction(selectedJob.id, false);
                      setSelectedJob(null);
                    }}
                    style={{
                      padding: '0.65rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Reject Post
                  </button>
                  <button 
                    onClick={async () => {
                      await handleAction(selectedJob.id, true);
                      setSelectedJob(null);
                    }}
                    style={{
                      padding: '0.65rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Approve Post
                  </button>
                </>
              ) : selectedJob.is_approved ? (
                <button 
                  onClick={async () => {
                    await handleAction(selectedJob.id, false);
                    setSelectedJob(null);
                  }}
                  style={{
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: '#ffffff',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Reject Job
                </button>
              ) : (
                <button 
                  onClick={async () => {
                    await handleAction(selectedJob.id, true);
                    setSelectedJob(null);
                  }}
                  style={{
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: '#ffffff',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Approve Post
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
