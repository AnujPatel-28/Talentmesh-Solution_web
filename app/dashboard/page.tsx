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

        // Redirect based on role
        if (user.role === 'admin' || user.role === 'super_admin') {
            router.replace('/dashboard/admin');
        } else if (user.role === 'recruiter') {
            router.replace(`/dashboard/recruiter/${user.id}`);
        } else {
            router.replace(`/dashboard/candidate/${user.id}`);
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
