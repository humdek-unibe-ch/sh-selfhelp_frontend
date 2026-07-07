/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { AdminPageContainer } from '../../components/shared/common/AdminPageContainer';
import { NavigationBuilderPage } from '../../components/cms/navigation/NavigationBuilderPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Navigation' };

export default async function AdminNavigationRoutePage() {
    await requireAdminPermission(PERMISSIONS.ADMIN_NAVIGATION_READ);
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <AdminPageContainer>
                    <NavigationBuilderPage />
                </AdminPageContainer>
            </Suspense>
        </AdminShell>
    );
}
