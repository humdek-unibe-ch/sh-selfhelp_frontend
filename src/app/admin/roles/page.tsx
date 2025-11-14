import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { RolesPage } from '../../components/cms/roles/roles-page/RolesPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export function AdminRolesPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <RolesPage />
      </Suspense>
    </AdminShell>
  );
}