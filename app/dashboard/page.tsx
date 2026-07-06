"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DashboardRedirect() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('tm_token') : null;

        const isLocalhost = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.endsWith('.localhost'));

        const getDestinationUrl = (subdomain: string, path: string) => {
            if (typeof window === 'undefined') return path;
            const host = window.location.host;
            const proto = window.location.protocol;

            if (isLocalhost) {
                // Same-origin path-based routing for local dev — subdomains don't resolve
                let url = `${proto}//${host}${path}`;
                if (token) {
                    const separator = url.includes('?') ? '&' : '?';
                    url = `${url}${separator}token=${token}`;
                }
                return url;
            }

            // Production: use subdomains
            const cleanHost = host.replace(/^(jobs|app|admin)\./, '');
            let url = `${proto}//${subdomain}.${cleanHost}${path}`;
            if (token) {
                const separator = url.includes('?') ? '&' : '?';
                url = `${url}${separator}token=${token}`;
            }
            return url;
        };

        // Redirect based on role
        if (user.role === 'admin' || user.role === 'super_admin') {
            const adminPath = process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || 'admin';
            window.location.replace(getDestinationUrl('admin', `/${adminPath}/dashboard`));
        } else if (user.role === 'recruiter') {
            window.location.replace(getDestinationUrl('app', '/recruiter/dashboard'));
        } else {
            window.location.replace(getDestinationUrl('jobs', '/candidate/dashboard'));
        }
    }, [user, isLoading, router]);

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#0c0c14',
            color: '#94a3b8'
        }}>
            Redirecting...
        </div>
    );
}
