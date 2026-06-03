/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { UnusedSectionsPage } from '../../components/cms/unused-sections/unused-sections-page/UnusedSectionsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Unused sections' };

export default async function AdminUnusedSectionsPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_SECTION_DELETE);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <UnusedSectionsPage />
      </Suspense>
    </AdminShell>
  );
}