import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { AssetsPage } from '../../components/cms/assets/assets-page/AssetsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export default function AdminAssetsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <AssetsPage />
      </Suspense>
    </AdminShell>
  );
} 