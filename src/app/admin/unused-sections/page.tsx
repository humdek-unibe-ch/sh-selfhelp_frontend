import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { UnusedSectionsPage } from '../../components/cms/unused-sections/unused-sections-page/UnusedSectionsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export const metadata = { title: 'Unused sections' };

export default function AdminUnusedSectionsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <UnusedSectionsPage />
      </Suspense>
    </AdminShell>
  );
}