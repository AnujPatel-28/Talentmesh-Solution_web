'use client';

import React from 'react';
import styles from '../dashboard.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function AdminInput({ label, error, helperText, ...props }: InputProps) {
  return (
    <div className={styles.field}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label className={styles.label}>{label}</label>
        {helperText && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{helperText}</span>}
      </div>
      <input 
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
  error?: string;
}

export function AdminSelect({ label, options, error, ...props }: SelectProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select 
        className={`${styles.select} ${error ? styles.inputError : ''}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export function AdminButton({ 
  variant = 'primary', 
  isLoading, 
  children, 
  ...props 
}: ButtonProps) {
  const variantClass = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    danger: styles.deleteButton,
    ghost: styles.actionButton
  }[variant];

  return (
    <button 
      className={variantClass} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
}
