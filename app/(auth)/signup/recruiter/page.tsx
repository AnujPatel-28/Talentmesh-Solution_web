"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RecruiterRegisterForm from '@/components/auth/RecruiterRegisterForm';
import BookACallForm from '@/components/auth/BookACallForm';
import styles from '../signup.module.css';

function RecruiterSignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const variant = (searchParams.get('variant') as 'call' | 'application') || 'application';

    return (
        <div className={styles.page}>
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            <div className={styles.gridOverlay} />

            <div className="w-full max-w-2xl mx-auto z-10">
                {variant === 'call' ? (
                    <BookACallForm onBack={() => router.push('/signup')} />
                ) : (
                    <RecruiterRegisterForm onBack={() => router.push('/signup')} />
                )}
            </div>
        </div>
    );
}

export default function RecruiterSignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <RecruiterSignupContent />
        </Suspense>
    );
}
