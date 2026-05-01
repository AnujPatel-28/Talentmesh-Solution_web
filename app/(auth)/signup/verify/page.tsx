"use client";
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge } from '@/lib/insforge';
import styles from '../signup.module.css';
import Link from 'next/link';
import Image from 'next/image';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const role = searchParams.get('role') || 'candidate';
    const name = searchParams.get('name') || '';

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const result = await response.json();

            if (result.error || !response.ok) {
                throw new Error(result.error || 'Invalid or expired code.');
            }

            const { data } = result;
            const userId = data.user.id;
            const actualToken = data.accessToken || (data as any).session?.access_token || '';

            // Log activity
            await insforge.database.from('activity').insert([{
                user_id: userId,
                description: `Verified email and joined as ${role}`,
                type: 'signup_verify'
            }]);

            login(actualToken, {
                id: userId,
                email,
                name,
                role: role as any,
                avatar_url: null
            });

            if (role === 'candidate') {
                window.location.assign('/onboarding/candidate');
            } else {
                window.location.assign('/onboarding/recruiter/setup');
            }
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            <div className={styles.gridOverlay} />

            <div className={styles.card}>
                <Link href="/" className={styles.logoWrap}>
                    <Image src="/TalentMesh_page-0002-removebg-preview.png" alt="TalentMesh" width={120} height={35} unoptimized />
                </Link>

                <form className={styles.form} onSubmit={handleVerify}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Check your email</h2>
                        <p className="text-sm text-slate-500">We sent a code to <strong>{email}</strong></p>
                    </div>

                    {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded-lg text-center mb-4">{error}</div>}

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Verification Code</label>
                        <input
                            type="text" className={styles.input} placeholder="123456"
                            value={otp} onChange={(e) => setOtp(e.target.value)}
                            required maxLength={6}
                            style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 700 }}
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading || otp.length < 6}>
                        {isLoading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
