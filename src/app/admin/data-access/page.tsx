import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { AuditLogsPage } from '../../components/cms/audit/audit-logs-page/AuditLogsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export const metadata = { title: 'Data access · Audit logs' };

export default function AdminAuditLogsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <AuditLogsPage />
      </Suspense>
    </AdminShell>
  );
}
