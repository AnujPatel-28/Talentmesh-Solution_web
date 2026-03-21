"use client";
import React from 'react';
import styles from '../../app/onboarding/onboarding.module.css';

interface OnboardingStepperProps {
    currentStep: 1 | 2 | 3;
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
    const steps = [
        { id: 1, label: 'Skills' },
        { id: 2, label: 'Interests' },
        { id: 3, label: 'Documents' },
    ];

    return (
        <div className={styles.stepper}>
            {steps.map((step, index) => (
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
                    {index < steps.length - 1 && (
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
