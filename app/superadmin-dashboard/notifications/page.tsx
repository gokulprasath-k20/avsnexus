'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import NotificationForm from '@/components/NotificationForm';

export default function SuperAdminNotifications() {
  return (
    <AppShell title="Notifications" subtitle="Broadcast messages to the entire platform">
      <div className="max-w-3xl mx-auto md:mx-0">
        <NotificationForm role="superadmin" />
      </div>
    </AppShell>
  );
}
