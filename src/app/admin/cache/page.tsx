/**
 * Admin Cache Management Page
 * Route: /admin/cache
 */

import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { CachePage } from '../../components/cms/cache';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export default function AdminCachePage() {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <CachePage />
            </Suspense>
        </AdminShell>
    );
}
