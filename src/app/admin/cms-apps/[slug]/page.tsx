/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../../components/shared/common/LoadingScreen';
import { AdminPageContainer } from '../../../components/shared/common/AdminPageContainer';
import { CmsAppDetailPage } from '../../../components/cms/cms-apps/CmsAppDetailPage';
import { AdminShell } from '../../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../../_lib/admin-guard';
import { PERMISSIONS } from '../../../../types/auth/jwt-payload.types';

export const metadata = { title: 'CMS App' };

export default async function AdminCmsAppDetailRoutePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    await requireAdminPermission(PERMISSIONS.ADMIN_CMS_APP_READ);
    const { slug } = await params;

    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <AdminPageContainer>
                    <CmsAppDetailPage slug={slug} />
                </AdminPageContainer>
            </Suspense>
        </AdminShell>
    );
}
