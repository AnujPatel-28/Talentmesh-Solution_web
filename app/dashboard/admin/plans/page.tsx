'use client';

import React from 'react';

export default function PlansPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Subscription Plans</h1>
        <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Manage pricing tiers, configure feature limits, and track active subscriptions across the platform.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Basic Plan */}
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2.5rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#475569', marginBottom: '1rem' }}>Basic / Free</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: '800', color: '#0f172a' }}>$0</span>
            <span style={{ color: '#64748b', fontWeight: '500', marginLeft: '0.5rem' }}>/ forever</span>
          </div>
          <div style={{ flex: 1 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['1 Active Job Posting', 'Basic Candidate Search', 'Standard Support', '5 Interview Invites / mo'].map((feat, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569', fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  {feat}
                </li>
              ))}
            </ul>
          </div>
          <button style={{ width: '100%', padding: '1rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', marginTop: '2.5rem', cursor: 'pointer' }}>Edit Plan Limits</button>
        </div>

        {/* Pro Plan */}
        <div style={{ background: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b', padding: '2.5rem', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', color: 'white', padding: '4px 16px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Most Popular</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#94a3b8', marginBottom: '1rem' }}>Professional</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: '800', color: 'white' }}>$299</span>
            <span style={{ color: '#94a3b8', fontWeight: '500', marginLeft: '0.5rem' }}>/ month</span>
          </div>
          <div style={{ flex: 1 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['10 Active Job Postings', 'Advanced AI Matching', 'Priority Support', 'Unlimited Invites', 'Custom Branding'].map((feat, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0', fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  {feat}
                </li>
              ))}
            </ul>
          </div>
          <button style={{ width: '100%', padding: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', marginTop: '2.5rem', cursor: 'pointer' }}>Edit Plan Limits</button>
        </div>

        {/* Enterprise Plan */}
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2.5rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#475569', marginBottom: '1rem' }}>Enterprise</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '2rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Custom</span>
          </div>
          <div style={{ flex: 1 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['Unlimited Everything', 'Dedicated Account Manager', 'SSO & SAML', 'Custom API Access', 'SLA Guarantee'].map((feat, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569', fontSize: '0.95rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  {feat}
                </li>
              ))}
            </ul>
          </div>
          <button style={{ width: '100%', padding: '1rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', marginTop: '2.5rem', cursor: 'pointer' }}>Edit Plan Limits</button>
        </div>

      </div>
    </div>
  );
}
