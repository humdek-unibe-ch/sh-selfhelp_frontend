/**
 * Admin Cache Management Page
 * Route: /admin/cache
 */

import { Suspense } from 'react';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { CachePage } from '../../components/admin/cache';
import { AdminShell } from '../../components/admin/admin-shell/AdminShell';

export default function AdminCachePage() {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <CachePage />
            </Suspense>
        </AdminShell>
    );
}
