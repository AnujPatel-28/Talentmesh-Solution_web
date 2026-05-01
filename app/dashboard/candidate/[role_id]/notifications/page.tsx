import React from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function CandidateNotificationsPage() {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <NotificationCenter role="candidate" />
        </div>
    );
}
