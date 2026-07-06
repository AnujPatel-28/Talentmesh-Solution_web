'use client';

import React from 'react';
import AdminComingSoonPage from '../_components/AdminComingSoonPage';
import { Users } from 'lucide-react';

export default function AdminTeamPage() {
  return (
    <AdminComingSoonPage
      title="Admin Team & RBAC Management"
      category="Access Control"
      description="Fine-grained Role-Based Access Control (RBAC), multi-admin permission matrix, and staff audit assignment tools are under active development."
      icon={<Users size={36} />}
      eta="Q3 2026"
      highlights={[
        'Granular Permission Matrix (Read/Write/Approve/Delete)',
        'Admin Staff Onboarding & Key Provisioning',
        'Role Inheritance & Custom Admin Role Builder',
        'Security Activity Logs & Multi-Factor Requirement'
      ]}
    />
  );
}
