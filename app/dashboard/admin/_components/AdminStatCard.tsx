import React from 'react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber';
  icon?: React.ReactNode;
}

const colorMap = {
  indigo: { bg: '#eef2ff', text: '#4f46e5', border: '#e0e7ff' },
  emerald: { bg: '#ecfdf5', text: '#059669', border: '#d1fae5' },
  rose: { bg: '#fff1f2', text: '#e11d48', border: '#ffe4e6' },
  amber: { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' }
};

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  label,
  value,
  color = 'indigo',
  icon
}) => {
  const styles = colorMap[color];
  return (
    <div style={{
      padding: '24px',
      borderRadius: '20px',
      backgroundColor: '#fff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{label}</span>
        {icon && (
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            backgroundColor: styles.bg, 
            color: styles.text,
            display: 'grid', 
            placeItems: 'center' 
          }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
    </div>
  );
};
