/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { UsersPage } from '../../components/cms/users/users-page/UsersPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Users' };

export default async function AdminUsersPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_USER_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <UsersPage />
      </Suspense>
    </AdminShell>
  );
}