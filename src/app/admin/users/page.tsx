import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { UsersPage } from '../../components/cms/users/users-page/UsersPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <UsersPage />
      </Suspense>
    </AdminShell>
  );
} 