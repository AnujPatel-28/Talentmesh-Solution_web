import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/server-auth';
import React from 'react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    console.warn(`[Admin Guard] Unauthorized access attempt by user ${user.id} (${user.role})`);
    redirect('/unauthorized');
  }

  return (
    <>
      {children}
    </>
  );
}
