'use client';

import React, { useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import sharedStyles from '../../shared-dashboard.module.css';

const IC = {
  mrr: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
  churn: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 12a11 11 0 1 1-11-11v11l9.66-5.58" /></svg>,
  arpu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h0M2 10h20" /></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
};

export default function BillingPage() {
  const [txData] = useState([
    { id: 'TX-9821', customer: 'Acme Corp', date: 'Oct 24, 2026', amount: '₹29,900.00', status: 'Succeeded' },
    { id: 'TX-9820', customer: 'Stark Industries', date: 'Oct 24, 2026', amount: '₹89,900.00', status: 'Succeeded' },
    { id: 'TX-9819', customer: 'Wayne Enterprises', date: 'Oct 23, 2026', amount: '₹29,900.00', status: 'Refunded' },
    { id: 'TX-9818', customer: 'Globex Corp', date: 'Oct 22, 2026', amount: '₹29,900.00', status: 'Succeeded' },
  ]);

  const columns: Column<any>[] = [
    {
      header: 'Transaction ID',
      key: 'id',
      render: (row) => <span style={{ fontWeight: 600, color: 'var(--tm-text-primary)' }}>{row.id}</span>
    },
    {
      header: 'Customer',
      key: 'customer',
      render: (row) => <span style={{ fontWeight: 500 }}>{row.customer}</span>
    },
    {
      header: 'Date',
      key: 'date',
      render: (row) => <span style={{ color: 'var(--tm-text-secondary)' }}>{row.date}</span>
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (row) => <span style={{ fontWeight: 700, color: 'var(--tm-text-primary)' }}>{row.amount}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <span style={{ 
          padding: '0.25rem 0.75rem', 
          borderRadius: '999px', 
          fontSize: '0.75rem', 
          fontWeight: '600',
          background: row.status === 'Succeeded' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: row.status === 'Succeeded' ? 'var(--status-success-text)' : 'var(--status-error-text)'
        }}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className={sharedStyles.dash} style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className={sharedStyles.pageHeader} style={{ marginBottom: '2rem' }}>
        <div className={sharedStyles.pageHeaderContent}>
          <h1 className={sharedStyles.pageHeaderTitle}>Revenue & Billing</h1>
          <p className={sharedStyles.pageHeaderSub}>Track MRR, recent transactions, and handle invoice exports.</p>
        </div>
        <button style={{ padding: '0.75rem 1.5rem', background: '#ffffff', color: '#0f172a', fontWeight: '600', borderRadius: '8px', border: '1px solid var(--tm-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {IC.download} Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className={sharedStyles.stats} style={{ marginBottom: '2.5rem' }}>
        <StatCard label="MRR" value="₹4,52,300" delta="+12.5%" icon={IC.mrr} />
        <StatCard label="Active Subscriptions" value="1,432" delta="+5.2%" icon={IC.users} />
        <StatCard label="Churn Rate" value="2.4%" delta="-0.4%" icon={IC.churn} />
        <StatCard label="Avg. Revenue Per User" value="₹12,400" delta="+1.1%" icon={IC.arpu} />
      </div>

      {/* Transactions Table */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--tm-border)', overflow: 'hidden', padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '700', color: 'var(--tm-text-primary)' }}>Recent Transactions</h2>
        <DataTable
          columns={columns}
          data={txData}
          emptyState={<p style={{ textAlign: 'center', color: 'var(--tm-text-secondary)' }}>No transactions found.</p>}
        />
      </div>

      {/* Custom Plan Builder */}
      <div style={{ marginTop: '2.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--tm-border)', padding: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--tm-text-primary)' }}>Create Custom Subscription Plan</h2>
        <form style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--tm-text-secondary)', marginBottom: '0.5rem' }}>Plan Name</label>
              <input type="text" placeholder="e.g. Enterprise Plus" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--tm-border)', background: 'var(--tm-surface)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--tm-text-secondary)', marginBottom: '0.5rem' }}>Monthly Price (INR)</label>
              <input type="number" placeholder="₹" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--tm-border)', background: 'var(--tm-surface)', outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--tm-text-secondary)', marginBottom: '0.5rem' }}>Plan Limits</label>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <input type="number" placeholder="Max Active Jobs" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--tm-border)', background: 'var(--tm-surface)', outline: 'none' }} />
              <input type="number" placeholder="Max Recruiter Seats" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--tm-border)', background: 'var(--tm-surface)', outline: 'none' }} />
            </div>
          </div>
          <button type="button" style={{ padding: '0.75rem', background: 'var(--primary-blue)', color: 'white', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Save Custom Plan
          </button>
        </form>
      </div>
    </div>
  );
}
