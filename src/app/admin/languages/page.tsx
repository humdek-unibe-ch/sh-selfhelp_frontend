/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { LanguagesPage } from '../../components/cms/languages/languages-page/LanguagesPage';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Languages' };

export default async function AdminLanguagesPage() {
    await requireAdminPermission(PERMISSIONS.ADMIN_SETTINGS);
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <LanguagesPage />
            </Suspense>
        </AdminShell>
    );
}
