/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { PluginsPage } from '../../components/cms/plugins';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';
import { requireAdminPermission } from '../../_lib/admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';

export const metadata = { title: 'Plugins' };

export default async function AdminPluginsPage() {
    await requireAdminPermission([
        PERMISSIONS.ADMIN_PLUGINS_MANAGE,
        PERMISSIONS.ADMIN_PLUGINS_EXECUTE,
        PERMISSIONS.ADMIN_PLUGINS_PURGE,
    ]);
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <PluginsPage />
            </Suspense>
        </AdminShell>
    );
}
