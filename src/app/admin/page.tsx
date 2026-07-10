/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../components/shared/common/LoadingScreen';
import { AdminPageContainer } from '../components/shared/common/AdminPageContainer';
import { AdminDashboardPage } from '../components/cms/dashboard/AdminDashboardPage';
import { AdminShell } from '../components/cms/admin-shell/AdminShell';

export const metadata = { title: 'Dashboard' };

/**
 * Admin index — usage analytics dashboard. Access is gated by the layout's
 * `requireAdminAccessSSR` (admin.access); the analytics widgets additionally
 * require `admin.analytics.read` and degrade gracefully without it.
 */
export default async function AdminDashboardRoute() {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <AdminPageContainer>
                    <AdminDashboardPage />
                </AdminPageContainer>
            </Suspense>
        </AdminShell>
    );
}
