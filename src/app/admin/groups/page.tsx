/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { GroupsPage } from '../../components/cms/groups/groups-page/GroupsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Groups' };

export default async function AdminGroupsPage() {
  await requireAdminPermission(PERMISSIONS.ADMIN_GROUP_READ);
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <GroupsPage />
      </Suspense>
    </AdminShell>
  );
}