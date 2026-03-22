"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { logAction } from '@/lib/admin/audit';
import { insforge } from '@/lib/insforge';
import styles from './mfa-verify.module.css';

export default function MFAVerifyPage() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBackup, setIsBackup] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, [isBackup]);

    const handleVerify = async (val: string) => {
        if (val.length !== 6 && !isBackup) return;
        
        setIsLoading(true);
        setError('');

        try {
            // Call our custom MFA verify API route
            const res = await fetch('/api/mfa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: val }),
            });
            const data = await res.json();

            // Get current user for logging
            const { data: sessionData } = await insforge.auth.getCurrentSession();
            const user = sessionData?.session?.user;

            if (!res.ok) {
                if (user) {
                    await logAction({
                        adminId: user.id,
                        action: 'security_mfa_failed',
                        status: 'failure'
                    });
                }
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= 5) {
                    setError('Too many failed attempts. Account locked for 15 minutes.');
                } else {
                    setError(`Incorrect code. ${5 - newAttempts} attempts remaining.`);
                }
                setCode('');
                return;
            }

            // Success
            if (user) {
                await logAction({
                    adminId: user.id,
                    action: 'security_mfa_success',
                    status: 'success'
                });
            }

            // Determine destination based on profile role
            const { data: profile } = await insforge.database
                .from('profiles')
                .select('role')
                .eq('id', user?.id)
                .single();

            const role = profile?.role;
            const dest = role === 'super_admin' ? '/dashboard/admin' 
                       : role === 'recruiter' ? '/dashboard/recruiter' 
                       : '/dashboard/candidate';
            router.push(dest);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackupVerify = async (e: FormEvent) => {
        e.preventDefault();
        setError('Manual backup code verification not fully implemented in this demo. Please use TOTP.');
    };

    const onInputChange = (val: string) => {
        const cleanVal = val.replace(/\D/g, '').substring(0, 6);
        setCode(cleanVal);
        if (cleanVal.length === 6) {
            handleVerify(cleanVal);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.logoWrap}>
                    <Image
                        src="/TalentMesh_page-0002-removebg-preview.png"
                        alt="TalentMesh"
                        width={180}
                        height={50}
                        unoptimized
                        priority
                    />
                </div>

                <div className={styles.header}>
                    <h1 className={styles.title}>Two-Factor Authentication</h1>
                    <p className={styles.subtitle}>
                        {isBackup 
                            ? 'Enter one of your 8-digit backup codes to sign in.' 
                            : 'Enter the 6-digit code from your authenticator app.'}
                    </p>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                {!isBackup ? (
                    <div className={styles.inputContainer}>
                        <input
                            ref={inputRef}
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => onInputChange(e.target.value)}
                            className={styles.mfaInput}
                            disabled={isLoading || attempts >= 5}
                            placeholder="000000"
                            autoFocus
                        />
                        {isLoading && <div className={styles.loaderLine} />}
                    </div>
                ) : (
                    <form onSubmit={handleBackupVerify} className={styles.form}>
                        <input
                            ref={inputRef}
                            type="text"
                            className={styles.backupInput}
                            placeholder="Enter backup code"
                            required
                        />
                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            Verify Backup Code
                        </button>
                    </form>
                )}

                <div className={styles.footer}>
                    <button 
                        onClick={() => setIsBackup(!isBackup)} 
                        className={styles.ghostBtn}
                    >
                        {isBackup ? 'Use Authenticator App' : 'Use a backup code instead'}
                    </button>
                    
                    <Link href="/login" className={styles.link}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
