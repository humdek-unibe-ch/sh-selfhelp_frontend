/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { AdminPageContainer } from '../../components/shared/common/AdminPageContainer';
import { CmsAppsPage } from '../../components/cms/cms-apps/CmsAppsPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'CMS Apps' };

export default async function AdminCmsAppsRoutePage() {
    await requireAdminPermission(PERMISSIONS.ADMIN_CMS_APP_READ);
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <AdminPageContainer>
                    <CmsAppsPage />
                </AdminPageContainer>
            </Suspense>
        </AdminShell>
    );
}
