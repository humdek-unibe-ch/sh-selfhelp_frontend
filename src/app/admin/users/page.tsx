import { Suspense } from 'react';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { UsersPage } from '../../components/admin/users/users-page/UsersPage';
import { AdminShell } from '../../components/admin/admin-shell/AdminShell';

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <UsersPage />
      </Suspense>
    </AdminShell>
  );
} 