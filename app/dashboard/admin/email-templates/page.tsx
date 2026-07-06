'use client';

import React from 'react';
import AdminComingSoonPage from '../_components/AdminComingSoonPage';
import { Mail } from 'lucide-react';

export default function EmailTemplatesPage() {
  return (
    <AdminComingSoonPage
      title="Email Template Studio"
      category="Communication Hub"
      description="Visual HTML drag-and-drop template builder, dynamic handlebar variable insertion, and live mail preview tools are currently under active development."
      icon={<Mail size={36} />}
      eta="Q3 2026"
      highlights={[
        'Visual Drag-and-Drop HTML Email Builder',
        'Dynamic Candidate & Recruiter Variable Merging',
        'Multi-lingual Email Localization Support',
        'A/B Testing & Delivery Heatmaps'
      ]}
    />
  );
}
