/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { SystemMaintenancePage } from '../../components/cms/system/system-maintenance-page/SystemMaintenancePage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'System Maintenance' };

export default async function AdminSystemPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_SYSTEM_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <SystemMaintenancePage />
      </Suspense>
    </AdminShell>
  );
}
