import { Suspense } from 'react';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { RolesPage } from '../../components/admin/roles/roles-page/RolesPage';
import { AdminShell } from '../../components/admin/admin-shell/AdminShell';

export default function AdminRolesPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <RolesPage />
      </Suspense>
    </AdminShell>
  );
} 