import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { ActionsPage } from '../../components/cms/actions/actions-page/ActionsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export default function AdminActionsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <ActionsPage />
      </Suspense>
    </AdminShell>
  );
}