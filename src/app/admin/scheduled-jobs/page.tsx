/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { ScheduledJobsPage } from '../../components/cms/scheduled-jobs/scheduled-jobs-page/ScheduledJobsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Scheduled jobs' };

export default async function AdminScheduledJobsPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <ScheduledJobsPage />
      </Suspense>
    </AdminShell>
  );
}