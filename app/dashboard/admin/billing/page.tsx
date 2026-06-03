'use client';

import React from 'react';

export default function BillingPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Revenue & Billing</h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Track MRR, recent transactions, and handle invoice exports.</p>
        </div>
        <button style={{ padding: '0.75rem 1.5rem', background: '#ffffff', color: '#0f172a', fontWeight: '600', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export CSV
        </button>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'MRR', value: '₹4,52,300', trend: '+12.5%', isUp: true },
          { label: 'Active Subscriptions', value: '1,432', trend: '+5.2%', isUp: true },
          { label: 'Churn Rate', value: '2.4%', trend: '-0.4%', isUp: true },
          { label: 'Avg. Revenue Per User', value: '₹12,400', trend: '+1.1%', isUp: true },
        ].map((kpi, idx) => (
          <div key={idx} style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>{kpi.value}</div>
              <div style={{ color: kpi.isUp ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                {kpi.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>Recent Transactions</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Transaction ID</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'TX-9821', customer: 'Acme Corp', date: 'Oct 24, 2026', amount: '₹29,900.00', status: 'Succeeded' },
                { id: 'TX-9820', customer: 'Stark Industries', date: 'Oct 24, 2026', amount: '₹89,900.00', status: 'Succeeded' },
                { id: 'TX-9819', customer: 'Wayne Enterprises', date: 'Oct 23, 2026', amount: '₹29,900.00', status: 'Refunded' },
                { id: 'TX-9818', customer: 'Globex Corp', date: 'Oct 22, 2026', amount: '₹29,900.00', status: 'Succeeded' },
              ].map((tx, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: '#0f172a' }}>{tx.id}</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#475569' }}>{tx.customer}</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{tx.date}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: '600', color: '#0f172a' }}>{tx.amount}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      background: tx.status === 'Succeeded' ? '#f0fdf4' : '#fef2f2',
                      color: tx.status === 'Succeeded' ? '#16a34a' : '#dc2626'
                    }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Plan Builder */}
      <div style={{ marginTop: '2.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>Create Custom Subscription Plan</h2>
        <form style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Plan Name</label>
              <input type="text" placeholder="e.g. Enterprise Plus" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Monthly Price (INR)</label>
              <input type="number" placeholder="₹" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Plan Limits</label>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <input type="number" placeholder="Max Active Jobs" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <input type="number" placeholder="Max Recruiter Seats" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          <button type="button" style={{ padding: '0.75rem', background: '#2563eb', color: 'white', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Save Custom Plan
          </button>
        </form>
      </div>
    </div>
  );
}
