/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from "react";
import { AdminShell } from '../../../components/cms/admin-shell/AdminShell';
import { LoadingScreen } from '../../../components/shared/common/LoadingScreen';
import ScheduledJobsCalendar from "../../../components/cms/scheduled-jobs/scheduled-jobs-calendar/ScheduledJobsCalendar";
import { requireAdminPermission } from '../../../_lib/admin-guard';
import { PERMISSIONS } from '../../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Scheduled jobs · Calendar' };

export default async function CalendarRoute() {
  await requireAdminPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <ScheduledJobsCalendar />
      </Suspense>
    </AdminShell>
  );
}
