import { Suspense } from 'react';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { GroupsPage } from '../../components/admin/groups/groups-page/GroupsPage';
import { AdminShell } from '../../components/admin/admin-shell/AdminShell';

export default function AdminGroupsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <GroupsPage />
      </Suspense>
    </AdminShell>
  );
} 