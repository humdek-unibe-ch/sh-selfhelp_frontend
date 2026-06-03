/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { DataAdminPage } from '../../components/cms/data/data-page/DataAdminPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Data' };

export default async function AdminDataPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_DATA_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <DataAdminPage />
      </Suspense>
    </AdminShell>
  );
}