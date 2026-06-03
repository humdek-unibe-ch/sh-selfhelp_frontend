/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { CachePage } from '../../components/cms/cache/cache-page/CachePage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Cache' };

export default async function AdminCachePage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_CACHE_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <CachePage />
      </Suspense>
    </AdminShell>
  );
}