/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { RolesPage } from '../../components/cms/roles/roles-page/RolesPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Roles' };

export default async function AdminRolesPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_ROLE_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <RolesPage />
      </Suspense>
    </AdminShell>
  );
}