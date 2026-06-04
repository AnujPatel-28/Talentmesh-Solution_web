"use client";
import React from 'react';
import Image from 'next/image';
import { PageHeader, ValueShowcase } from '@/components/ui';
import { CTA } from '@/components/sections';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import styles from './about.module.css';

export default function AboutPage() {
    return (
        <main className={styles.page}>
            {/* Hero Section */}
            <PageHeader
                title="Revolutionizing Recruitment"
                highlight="through AI"
                description="We bridge the gap between top talent and leading employers using intelligent, data-driven matching technology to ensure precision connectivity in the modern workforce."
                breadcrumb="Enterprise Recruitment Reimagined"
                light
            />

            {/* Mission Section */}
            <section className={styles.missionSection}>
                <div className={styles.missionGrid}>
                    <AnimateOnScroll animation="fadeRight">
                        <div className={styles.missionContent}>
                            <h2 className={styles.missionTitle}>Our Mission</h2>
                            <p className={styles.missionText}>
                                To empower every professional to find their perfect role and every company 
                                to build their dream team effortlessly. We believe in removing friction from 
                                the hiring process through transparency, speed, and uncompromising quality. 
                                Our enterprise-grade solutions scale with your organization's needs.
                            </p>
                        </div>
                    </AnimateOnScroll>
                    
                    <AnimateOnScroll animation="fadeLeft">
                        <div className={styles.missionImageWrapper}>
                            {/* Fallback inline style for background shape behind image */}
                            <div className={styles.missionImageBg}></div>
                            <Image 
                                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80" 
                                alt="Team Meeting" 
                                fill 
                                className={styles.missionImg}
                                unoptimized
                            />
                        </div>
                    </AnimateOnScroll>
                </div>
            </section>

            {/* Core Values Section (Reusing custom component) */}
            <AnimateOnScroll animation="fadeUp">
                <ValueShowcase />
            </AnimateOnScroll>

            {/* CTA Section (Reusing custom component) */}
            <AnimateOnScroll animation="scaleUp">
                <CTA />
            </AnimateOnScroll>
        </main>
    );
}