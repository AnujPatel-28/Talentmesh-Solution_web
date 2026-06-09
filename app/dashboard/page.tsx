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
        const getSubdomainUrl = (subdomain: string, path: string) => {
            if (typeof window === 'undefined') return path;
            const host = window.location.host;
            const proto = window.location.protocol;
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
            window.location.replace(getSubdomainUrl('admin', '/admin/dashboard'));
        } else if (user.role === 'recruiter') {
            window.location.replace(getSubdomainUrl('app', '/recruiter/dashboard'));
        } else {
            window.location.replace(getSubdomainUrl('jobs', '/'));
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
