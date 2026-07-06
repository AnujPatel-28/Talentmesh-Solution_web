'use client';

import React from 'react';
import AdminComingSoonPage from '../_components/AdminComingSoonPage';
import { Layers } from 'lucide-react';

export default function PlansPage() {
  return (
    <AdminComingSoonPage
      title="Plan Tier & Quota Manager"
      category="Subscription Architecture"
      description="Dynamic feature gating, custom tier limit configurators, and real-time candidate search quota enforcement are currently being integrated."
      icon={<Layers size={36} />}
      eta="Q3 2026"
      highlights={[
        'Dynamic Job & Candidate Search Quota Enforcement',
        'Custom Enterprise Plan Feature Toggles',
        'Automated Upgrade / Downgrade Prorations',
        'Add-on Credit Bundles & Coupon Engine'
      ]}
    />
  );
}
