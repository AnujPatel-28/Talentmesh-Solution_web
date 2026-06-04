'use client';
import React, { useState, useRef, useEffect } from 'react';

export interface CustomSelectProps {
  name?: string;
  value: string;
  onChange: (e: { target: { name: string; value: string } } | any) => void;
  options: { label: string; value: string }[] | string[] | readonly string[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  style?: React.CSSProperties;
  footer?: React.ReactNode;
  disabled?: boolean;
}

export function CustomSelect({ name, value, onChange, options, placeholder, className, required, style, footer, disabled }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedLabel = normalizedOptions.find(o => o.value === value)?.label || placeholder || 'Select...';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div 
        className={className} 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#f1f5f9' : '#f8fafc', width: '100%', opacity: disabled ? 0.6 : 1 }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: value ? '#0f172a' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedLabel}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: '8px' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {isOpen && (
        <div style={{ 
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, 
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', 
          zIndex: 100, maxHeight: '240px', overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column'
        }}>
          {placeholder && !required && (
            <div 
              style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '14.5px', color: '#94a3b8', fontStyle: 'italic' }}
              onClick={() => {
                 onChange({ target: { name: name || '', value: '' } });
                 setIsOpen(false);
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              {placeholder}
            </div>
          )}
          {normalizedOptions.map((opt, idx) => (
            <div 
              key={`${opt.value}-${idx}`}
              style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '14.5px', color: '#334155' }}
              onClick={() => {
                 const event = {
                   target: { name: name || '', value: opt.value },
                   preventDefault: () => {},
                   stopPropagation: () => {}
                 };
                 onChange(event);
                 setIsOpen(false);
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e88e5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#334155'; }}
            >
              {opt.label}
            </div>
          ))}
          {footer && (
            <div onClick={() => setIsOpen(false)}>
              {footer}
            </div>
          )}
        </div>
      )}
      {required && (
        <input 
          type="text" 
          value={value} 
          required 
          style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none', bottom: 0, left: '50%' }} 
          onChange={() => {}} 
          onFocus={() => setIsOpen(true)}
        />
      )}
    </div>
  );
}
