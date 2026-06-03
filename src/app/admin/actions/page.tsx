/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { ActionsPage } from '../../components/cms/actions/actions-page/ActionsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Actions' };

export default async function AdminActionsPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_ACTION_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <ActionsPage />
      </Suspense>
    </AdminShell>
  );
}