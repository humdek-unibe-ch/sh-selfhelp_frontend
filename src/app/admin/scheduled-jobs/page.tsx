import { Suspense } from 'react';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { ScheduledJobsPage } from '../../components/admin/scheduled-jobs/scheduled-jobs-page/ScheduledJobsPage';
import { AdminShell } from '../../components/admin/admin-shell/AdminShell';

export default function AdminScheduledJobsPage() {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <ScheduledJobsPage />
            </Suspense>
        </AdminShell>
    );
} 