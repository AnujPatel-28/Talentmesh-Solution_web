"use client";

import React from 'react';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

/**
 * RecruiterLayoutClient — Now a pass-through wrapper.
 * The shared dashboard layout (app/dashboard/layout.tsx) provides the sidebar,
 * topbar, search, notifications, and all shell functionality for recruiter routes.
 * This component only wraps children in an error boundary for recruiter-specific error handling.
 */
export default function RecruiterLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <GlobalErrorBoundary>
            {children}
        </GlobalErrorBoundary>
    );
}
