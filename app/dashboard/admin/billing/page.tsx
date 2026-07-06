'use client';

import React from 'react';
import AdminComingSoonPage from '../_components/AdminComingSoonPage';
import { CreditCard } from 'lucide-react';

export default function BillingPage() {
  return (
    <AdminComingSoonPage
      title="Revenue & Billing Engine"
      category="Financial Module"
      description="Automated Stripe & Razorpay payment reconciliation, real-time MRR analytics, automated GST invoices, and subscription management are currently under active development."
      icon={<CreditCard size={36} />}
      eta="Q3 2026"
      highlights={[
        'Automated GST & Tax Invoice PDF Generation',
        'Real-time MRR, ARR, and Churn Telemetry',
        'Stripe & Razorpay Webhook Syncing',
        'Custom Enterprise Subscription Billing'
      ]}
    />
  );
}
