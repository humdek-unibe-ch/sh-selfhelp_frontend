import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { GroupsPage } from '../../components/cms/groups/groups-page/GroupsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export default function AdminGroupsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <GroupsPage />
      </Suspense>
    </AdminShell>
  );
}