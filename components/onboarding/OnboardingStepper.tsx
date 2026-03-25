"use client";
import React from 'react';
import styles from '../../app/onboarding/onboarding.module.css';

interface OnboardingStepperProps {
    currentStep: number;
    steps?: string[];
}

export function OnboardingStepper({ currentStep, steps = ['Skills', 'Interests', 'Documents'] }: OnboardingStepperProps) {
    const items = steps.map((label, index) => ({
        id: index + 1,
        label,
    }));

    return (
        <div className={styles.stepper}>
            {items.map((step, index) => (
                <React.Fragment key={step.id}>
                    <span 
                        className={`
                            ${styles.stepDot} 
                            ${currentStep > step.id ? styles.stepDotDone : ''} 
                            ${currentStep === step.id ? styles.stepDotActive : ''}
                        `}
                    >
                        {currentStep > step.id ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            step.id
                            )}
                        </span>
                    {index < items.length - 1 && (
                        <span 
                            className={`
                                ${styles.stepLine} 
                                ${currentStep > step.id ? styles.stepLineDone : ''} 
                                ${currentStep === step.id ? styles.stepLineActive : ''}
                            `} 
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
