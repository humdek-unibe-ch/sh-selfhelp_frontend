import { Suspense } from 'react';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { AdminShell } from '../../components/admin/admin-shell/AdminShell';
import { DataAdminPage } from '../../components/admin/data/data-page/DataAdminPage';

export default function AdminDataPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}> 
        <DataAdminPage />
      </Suspense>
    </AdminShell>
  );
}







