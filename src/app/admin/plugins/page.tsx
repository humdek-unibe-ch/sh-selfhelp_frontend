/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../components/shared/common/LoadingScreen';
import { PluginsPage } from '../../components/cms/plugins';
import { AdminShell } from '../../components/cms/admin-shell/AdminShell';

export const metadata = { title: 'Plugins' };

export default function AdminPluginsPage() {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <PluginsPage />
            </Suspense>
        </AdminShell>
    );
}
