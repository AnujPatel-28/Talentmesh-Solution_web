import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'var(--white)',
            color: 'var(--deep-navy)',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Elements */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'var(--light-ice-blue)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                opacity: 0.5,
                zIndex: 0,
            }}></div>

            <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-10%',
                width: '500px',
                height: '500px',
                background: 'var(--alice-blue)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                opacity: 0.6,
                zIndex: 0,
            }}></div>

            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px' }}>

                <h1 style={{
                    fontSize: '12rem',
                    fontWeight: 900,
                    color: 'var(--light-ice-blue)',
                    marginBottom: '-3rem',
                    lineHeight: 1,
                    letterSpacing: '-0.05em',
                    userSelect: 'none'
                }}>404</h1>

                <h2 style={{
                    fontSize: '3.5rem',
                    fontWeight: 800,
                    marginBottom: '1.5rem',
                    color: 'var(--deep-navy)',
                    letterSpacing: '-0.02em'
                }}>Page Not Found</h2>

                <p style={{
                    color: 'var(--medium-grey)',
                    marginBottom: '3rem',
                    lineHeight: '1.6',
                    fontSize: '1.125rem'
                }}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <Link href="/" style={{
                    background: 'var(--primary-blue)',
                    color: 'var(--white)',
                    padding: '1rem 3rem',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    boxShadow: '0 10px 25px -5px rgba(33, 150, 243, 0.3)',
                    transition: 'all 0.3s ease',
                    display: 'inline-block'
                }}>
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
