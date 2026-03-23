import React from 'react';
import { insforgeAdmin } from '@/lib/insforge-admin';
import RecruiterLayoutClient from './RecruiterLayoutClient';

export default async function RecruiterDashboardLayout({ children }: { children: React.ReactNode }) {
    // 1. Get Session User (In a real app, use headers/cookies to get current user ID)
    // For this demonstration, we'll assume the client component handles the auth state
    // but the server can pre-fetch permissions if we have the ID.
    // However, since we're in a shared layout, let's pass it to a client component 
    // that fetches permissions based on the active user.
    
    return (
        <RecruiterLayoutClient>
            {children}
        </RecruiterLayoutClient>
    );
}
