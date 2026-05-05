'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import NotificationForm from '@/components/NotificationForm';

export default function ModuleAdminNotifications() {
  return (
    <AppShell title="Notifications" subtitle="Send targeted messages to students in your track">
      <div className="max-w-3xl mx-auto md:mx-0">
        <NotificationForm role="moduleAdmin" />
      </div>
    </AppShell>
  );
}
