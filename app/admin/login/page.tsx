"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './admin-login.module.css';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'anujpatel30106@gmail.com,admin@talentmesh.ai,hello@talentmesh.ai')
    .split(',')
    .map(e => e.trim().toLowerCase());

export default function AdminLoginPage() {
    const router = useRouter();
    const { signIn, user, isLoading: authLoading } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // If already logged in as admin, redirect to dashboard
    useEffect(() => {
        if (!authLoading && user && (user.role === 'super_admin' || user.role === 'admin')) {
            router.push(`/dashboard/admin/${user.role_id}`);
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Restriction Check
        if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
            setError('Access Denied: This portal is restricted to system administrators.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // 2. Attempt sign in
            const result = await signIn(email, password);

            if (result.error) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            // 3. Verify role after sign in
            if (result.user && result.user.role !== 'super_admin' && result.user.role !== 'admin') {
                setError('Access Denied: You do not have administrator privileges.');
                setIsLoading(false);
                return;
            }

            // 4. Success - Direct Redirect
            if (result.user) {
                router.push(`/dashboard/admin/${result.user.role_id}`);
            }
            
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return <div className={styles.loader}>Loading...</div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            
            <div className={styles.card}>
                <div className={styles.logoWrap}>
                    <Image
                        src="/TalentMesh_page-0002-removebg-preview.png"
                        alt="TalentMesh Admin"
                        width={160}
                        height={45}
                        unoptimized
                    />
                    <div className={styles.badge}>System Administration</div>
                </div>

                <div className={styles.header}>
                    <h1 className={styles.title}>Admin Portal</h1>
                    <p className={styles.subtitle}>Secure access for TalentMesh core operations</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {error && <div className={styles.errorAlert}>{error}</div>}
                    
                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="admin-email">Admin Email</label>
                        <div className={styles.inputWrap}>
                            <input
                                id="admin-email"
                                type="email"
                                className={styles.input}
                                placeholder="admin@talentmesh.ai"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="admin-password">Secure Password</label>
                        <div className={styles.inputWrap}>
                            <input
                                id="admin-password"
                                type={showPassword ? 'text' : 'password'}
                                className={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button 
                                type="button" 
                                className={styles.eyeBtn} 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verifying...' : 'Access Dashboard'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <Link href="/login" className={styles.backLink}>
                        Back to public login
                    </Link>
                </div>
            </div>
        </div>
    );
}
