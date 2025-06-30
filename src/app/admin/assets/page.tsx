import { Suspense } from 'react';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { AssetsPage } from '../../components/admin/assets/assets-page/AssetsPage';
import { AdminShell } from '../../components/admin/admin-shell/AdminShell';

export default function AdminAssetsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <AssetsPage />
      </Suspense>
    </AdminShell>
  );
} 