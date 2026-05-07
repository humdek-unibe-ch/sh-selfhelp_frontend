/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { DataAdminPage } from '../../components/cms/data/data-page/DataAdminPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export const metadata = { title: 'Data' };

export default function AdminDataPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <DataAdminPage />
      </Suspense>
    </AdminShell>
  );
}