/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { AuditLogsPage } from '../../components/cms/audit/audit-logs-page/AuditLogsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Data access · Audit logs' };

export default async function AdminAuditLogsPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_AUDIT_VIEW);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <AuditLogsPage />
      </Suspense>
    </AdminShell>
  );
}
