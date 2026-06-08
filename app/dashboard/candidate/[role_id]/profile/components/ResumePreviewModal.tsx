import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../../../shared-dashboard.module.css';

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  loading: () => <div className={styles.loading}>Loading PDF Preview...</div>,
  ssr: false
});

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeUrl: string;
}

export default function ResumePreviewModal({ isOpen, onClose, resumeUrl }: ResumePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.dialogOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="resume-preview-title">
      <div 
        className={styles.dialogContent} 
        style={{ maxWidth: '900px', width: '95%', height: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 id="resume-preview-title" className={styles.dialogTitle}>Resume Preview</h3>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            aria-label="Close preview"
          >
            &times;
          </button>
        </div>
        <div style={{ flex: 1, marginTop: '1rem', overflow: 'hidden' }}>
          <PdfViewer url={resumeUrl} />
        </div>
      </div>
    </div>
  );
}
