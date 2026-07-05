import React from 'react';

export default function SalaryGuideLoading() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .sk-pulse {
          animation: skeleton-pulse 1.5s ease-in-out infinite;
          background-color: #e2e8f0;
        }
      `}</style>

      {/* Hero Container */}
      <div style={{
        background: 'linear-gradient(135deg, #12263A 0%, #1e3a5f 60%, #12263A 100%)',
        padding: '3.5rem 2rem 6.5rem',
        textAlign: 'center',
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div className="sk-pulse" style={{ width: '360px', height: '34px', borderRadius: '6px', marginBottom: '8px' }} />
        <div className="sk-pulse" style={{ width: '420px', height: '14px', borderRadius: '4px' }} />

        {/* Two-input search card placeholder */}
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
          height: '56px',
          boxSizing: 'border-box'
        }}>
          <div className="sk-pulse" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
          <div className="sk-pulse" style={{ flex: 1, height: '16px', borderRadius: '4px', marginLeft: '8px' }} />
          <div style={{ width: '1px', height: '24px', background: '#E2E5EA', margin: '0 16px' }} />
          <div className="sk-pulse" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
          <div className="sk-pulse" style={{ flex: 1, height: '16px', borderRadius: '4px', marginLeft: '8px' }} />
          <div className="sk-pulse" style={{ width: '100px', height: '44px', borderRadius: '9999px', marginLeft: '12px' }} />
        </div>
      </div>

      {/* Content Below Hero */}
      <div style={{ maxWidth: '960px', margin: '5rem auto 3rem', padding: '0 2rem' }}>
        <div className="sk-pulse" style={{ width: '380px', height: '24px', borderRadius: '6px', marginBottom: '24px' }} />

        {/* Filter bar skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div className="sk-pulse" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
          <div className="sk-pulse" style={{ width: '160px', height: '36px', borderRadius: '8px' }} />
        </div>

        {/* Salary card list */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e5ea', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <div className="sk-pulse" style={{ width: '60%', height: '16px', borderRadius: '4px' }} />
              <div className="sk-pulse" style={{ width: '80%', height: '20px', borderRadius: '4px' }} />
              <div className="sk-pulse" style={{ width: '40%', height: '12px', borderRadius: '3px' }} />
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="sk-pulse" style={{ width: '80px', height: '10px', borderRadius: '3px' }} />
                <div className="sk-pulse" style={{ width: '100px', height: '10px', borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
