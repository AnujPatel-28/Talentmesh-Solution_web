"use client";

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './setup-mfa.module.css';

export default function SetupMFAPage() {
    const router = useRouter();
    
    const [step, setStep] = useState<'enroll' | 'verify' | 'backup'>('enroll');
    const [factorId, setFactorId] = useState('');
    const [qrUri, setQrUri] = useState('');
    const [secret, setSecret] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // 1. Enrollment Initiation — call our API route
    const startEnrollment = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/mfa/enroll', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Enrollment failed');

            setFactorId(data.id);
            setSecret(data.secret);
            // Build a QR code image URL from the TOTP URI
            setQrUri(
                `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.uri)}`
            );
            setStep('enroll');
        } catch (err: any) {
            setError(err.message || 'Failed to start MFA enrollment');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startEnrollment();
    }, []);

    // 2. Verification — call our verify API route
    const handleVerifyEnrollment = async (e: FormEvent) => {
        e.preventDefault();
        if (verifyCode.length !== 6) return;
        
        setIsVerifying(true);
        setError('');

        try {
            const res = await fetch('/api/mfa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ factorId, code: verifyCode }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Verification failed');

            // Generate and save backup codes
            await generateBackupCodes();
            setStep('backup');
        } catch (err: any) {
            setError(err.message || 'Verification failed. Try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const generateBackupCodes = async () => {
        const res = await fetch('/api/mfa/backup-codes', {
            method: 'POST',
            credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to generate backup codes');
        }

        setBackupCodes(data.codes || []);
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Initializing secure enrollment...</p>
            </div>
        );
    }

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

                {step === 'enroll' && (
                    <>
                        <div className={styles.header}>
                            <h1 className={styles.title}>Secure Your Account</h1>
                            <p className={styles.subtitle}>
                                Open Google Authenticator or Authy and scan this QR code.
                            </p>
                        </div>

                        <div className={styles.qrContainer}>
                            {qrUri && <img src={qrUri} alt="MFA QR Code" className={styles.qrCode} />}
                        </div>

                        <div className={styles.manualEntry}>
                            <p className={styles.label}>Can&apos;t scan? Enter manually:</p>
                            <code className={styles.secretText}>{secret}</code>
                        </div>

                        <form className={styles.form} onSubmit={handleVerifyEnrollment}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>6-Digit Verification Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    className={styles.input}
                                    value={verifyCode}
                                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>

                            {error && <div className={styles.errorMessage}>{error}</div>}

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={isVerifying || verifyCode.length !== 6}
                            >
                                {isVerifying ? 'Verifying...' : 'Enable MFA'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'backup' && (
                    <>
                        <div className={styles.header}>
                            <h1 className={styles.title}>MFA Enabled!</h1>
                            <p className={styles.subtitle}>
                                Your account is now protected. Save these backup codes in a safe place.
                            </p>
                        </div>

                        <div className={styles.backupGrid}>
                            {backupCodes.map((code, i) => (
                                <div key={i} className={styles.backupCode}>{code}</div>
                            ))}
                        </div>

                        <p className={styles.warning}>
                            ⚠️ These codes can be used if you lose your authenticator app. 
                            Each code can only be used once.
                        </p>

                        <button
                            onClick={() => router.push('/dashboard/admin')}
                            className={styles.submitBtn}
                        >
                            Go to Dashboard
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
