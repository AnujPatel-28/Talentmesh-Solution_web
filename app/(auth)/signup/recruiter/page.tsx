"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RecruiterRegisterForm from '@/components/auth/RecruiterRegisterForm';
import BookACallForm from '@/components/auth/BookACallForm';
import styles from '../signup.module.css';
import HeroBg from '@/components/ui/HeroBg/HeroBg';
import { motion } from 'framer-motion';

function RecruiterSignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const variant = (searchParams.get('variant') as 'call' | 'application') || 'application';

    return (
        <div className={styles.page}>
            <HeroBg src="/bg2job.png" fixed />
            <div className={styles.bgGlow1} />
            <div className={styles.bgGlow2} />
            <div className={styles.gridOverlay} />

            <motion.div 
                className="w-full max-w-2xl mx-auto z-10"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
                {variant === 'call' ? (
                    <BookACallForm onBack={() => router.push('/signup')} />
                ) : (
                    <RecruiterRegisterForm onBack={() => router.push('/signup')} />
                )}
            </motion.div>
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
