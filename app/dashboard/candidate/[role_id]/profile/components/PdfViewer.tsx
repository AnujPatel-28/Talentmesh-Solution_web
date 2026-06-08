import React from 'react';
import styles from '../../../../shared-dashboard.module.css';

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  // Production Security Hardening: Ensure only trusted secure protocols and whitelisted storage hosts are loaded.
  const isTrusted = React.useMemo(() => {
    if (url.startsWith('/')) return true; // Relative URLs to the same host are trusted
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname;
      return (
        parsedUrl.protocol === 'https:' && 
        (host.endsWith('.insforge.app') || 
         host.endsWith('s3.us-east-2.amazonaws.com') ||
         host === 'localhost' ||
         host === '127.0.0.1')
      );
    } catch {
      return false;
    }
  }, [url]);

  if (!isTrusted) {
    return (
      <div className={styles.pdfContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', padding: '1rem', textAlign: 'center' }}>
        <span>⚠️ Security Block:</span>
        <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>The resume preview URL is not from a trusted source.</span>
      </div>
    );
  }

  return (
    <div className={styles.pdfContainer} style={{ display: 'block', height: '100%', width: '100%' }}>
      <iframe
        src={`${url}#toolbar=0&navpanes=0`}
        width="100%"
        height="100%"
        style={{ border: 'none', borderRadius: '8px', display: 'block' }}
        title="Resume Preview"
      />
    </div>
  );
}
