'use client';

import React, { useState } from 'react';

export default function EmailTemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState('welcome');

  const templates = [
    { id: 'welcome', name: 'Welcome Email', type: 'Onboarding' },
    { id: 'reset', name: 'Password Reset', type: 'Auth' },
    { id: 'alert', name: 'Job Alert Match', type: 'Notification' },
    { id: 'offer', name: 'Offer Letter', type: 'Recruiting' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Email Templates</h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Customize the automated emails sent to users across the platform.</p>
        </div>
        <button style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
          Create Template
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        
        {/* Sidebar */}
        <div style={{ width: '300px', borderRight: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <input 
              type="text" 
              placeholder="Search templates..." 
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '1rem' }}>
            {templates.map(t => (
              <div 
                key={t.id} 
                onClick={() => setActiveTemplate(t.id)}
                style={{ padding: '1rem', borderRadius: '8px', background: activeTemplate === t.id ? '#eff6ff' : 'transparent', border: activeTemplate === t.id ? '1px solid #bfdbfe' : '1px solid transparent', cursor: 'pointer', marginBottom: '0.5rem', transition: 'all 0.2s' }}
              >
                <div style={{ fontWeight: '600', color: activeTemplate === t.id ? '#1e3a8a' : '#334155', marginBottom: '0.25rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Subject Line</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#0f172a' }}>Welcome to TalentMesh, {'{{user_first_name}}'}!</div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Send Test</button>
              <button style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Edit HTML</button>
            </div>
          </div>
          
          <div style={{ flex: 1, padding: '3rem', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
            {/* Email Canvas Mock */}
            <div style={{ width: '100%', maxWidth: '600px', background: '#ffffff', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', padding: '2rem', textAlign: 'center', color: 'white' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>TALENTMESH</h2>
              </div>
              <div style={{ padding: '3rem 2.5rem', color: '#334155', lineHeight: '1.6' }}>
                <h3 style={{ color: '#0f172a', fontSize: '1.25rem', marginTop: 0 }}>Hi <span style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', color: '#b45309' }}>{'{{user_first_name}}'}</span>,</h3>
                <p>Welcome to the premium hiring network. We're thrilled to have you onboard.</p>
                <p>To get started and unlock personalized job matches, please verify your email address by clicking the button below:</p>
                
                <div style={{ textAlign: 'center', margin: '2.5rem 0' }}>
                  <a href="#" style={{ display: 'inline-block', background: '#3b82f6', color: 'white', padding: '1rem 2rem', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>
                    Verify Email Address
                  </a>
                </div>
                
                <p>If you have any questions, our support team is always here to help.</p>
                <p style={{ marginTop: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>Best regards,<br/>The TalentMesh Team</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
