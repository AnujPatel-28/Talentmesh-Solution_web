import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerUser } from '@/lib/server-auth';

export default async function CandidateDashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const depthStr = headersList.get('x-redirect-depth') || '0';
  const depth = parseInt(depthStr, 10);

  if (depth > 3) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f3f4f6',
        margin: 0
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '440px',
          border: '1px solid #e5e7eb'
        }}>
          <h1 style={{ color: '#dc2626', marginTop: 0, fontSize: '1.5rem' }}>Unauthorized (403)</h1>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            A redirection loop was detected due to mismatched role authorizations. Please contact your system administrator.
          </p>
          <a href="/login" style={{
            display: 'inline-block',
            padding: '0.625rem 1.25rem',
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}>Return to Login</a>
        </div>
      </div>
    );
  }

  const user = await getServerUser();
  if (!user) {
    redirect(`/login?rd=${depth + 1}`);
  }

  return <>{children}</>;
}
