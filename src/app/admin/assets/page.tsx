/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { AssetsPage } from '../../components/cms/assets/assets-page/AssetsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Assets' };

export default async function AdminAssetsPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_ASSET_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <AssetsPage />
      </Suspense>
    </AdminShell>
  );
}