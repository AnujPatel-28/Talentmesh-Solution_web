import React from 'react';

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const AdminInput: React.FC<AdminInputProps> = ({ label, ...props }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>{label}</label>
    <input
      {...props}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        ...props.style
      }}
    />
  </div>
);

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
}

export const AdminSelect: React.FC<AdminSelectProps> = ({ label, options, ...props }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>{label}</label>
    <select
      {...props}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '0.95rem',
        outline: 'none',
        backgroundColor: '#fff',
        cursor: 'pointer',
        ...props.style
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const AdminButton: React.FC<AdminButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  ...props 
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'secondary': return { bg: '#f1f5f9', text: '#475569', border: '1px solid #e2e8f0' };
      case 'danger': return { bg: '#ef4444', text: '#fff', border: 'none' };
      default: return { bg: '#2563eb', text: '#fff', border: 'none' };
    }
  };
  const styles = getStyles();

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      style={{
        padding: '12px 24px',
        borderRadius: '12px',
        fontWeight: 700,
        fontSize: '0.95rem',
        cursor: (isLoading || props.disabled) ? 'not-allowed' : 'pointer',
        backgroundColor: styles.bg,
        color: styles.text,
        border: styles.border,
        opacity: (isLoading || props.disabled) ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        ...props.style
      }}
    >
      {isLoading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
      {children}
    </button>
  );
};

interface AdminTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const AdminTextArea: React.FC<AdminTextAreaProps> = ({ label, ...props }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>{label}</label>
    <textarea
      {...props}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        minHeight: '100px',
        resize: 'vertical',
        ...props.style
      }}
    />
  </div>
);
