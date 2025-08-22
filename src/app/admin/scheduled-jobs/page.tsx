import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { ScheduledJobsPage } from '../../components/cms/scheduled-jobs/scheduled-jobs-page/ScheduledJobsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export default function AdminScheduledJobsPage() {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <ScheduledJobsPage />
            </Suspense>
        </AdminShell>
    );
} 