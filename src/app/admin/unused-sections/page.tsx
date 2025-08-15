import { Suspense } from 'react';
import { AdminShell } from '../../components/admin/admin-shell/AdminShell';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { UnusedSectionsPage } from '../../components/admin/unused-sections/unused-sections-page/UnusedSectionsPage';

/**
 * Unused Sections Admin Page
 * Displays all unused sections with search, delete, and bulk delete functionality
 */
export default function UnusedSectionsAdminPage() {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <UnusedSectionsPage />
            </Suspense>
        </AdminShell>
    );
}
