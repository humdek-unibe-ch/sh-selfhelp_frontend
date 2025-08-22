import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { DataAdminPage } from '../../components/cms/data/data-page/DataAdminPage';

export default function AdminDataPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}> 
        <DataAdminPage />
      </Suspense>
    </AdminShell>
  );
}







