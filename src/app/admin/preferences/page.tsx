import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { PreferencesPage } from '../../components/cms/preferences/preferences-page/PreferencesPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export default function AdminPreferencesPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <PreferencesPage />
      </Suspense>
    </AdminShell>
  );
}