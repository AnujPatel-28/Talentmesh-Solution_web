"use client";

import React from 'react';

export default function CompaniesPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem' }}>Companies / Employers</h1>
      <p style={{ color: 'var(--muted-foreground)' }}>
        Manage company profiles, branding, and seat limits here.
      </p>
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '3rem', 
        textAlign: 'center', 
        border: '1px dashed var(--border)', 
        borderRadius: '8px',
        background: 'var(--secondary-background)'
      }}>
        <p>This module is currently under construction.</p>
      </div>
    </div>
  );
}
