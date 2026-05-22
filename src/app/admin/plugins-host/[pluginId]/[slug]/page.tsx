/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../../../components/shared/common/LoadingScreen';
import { AdminShell } from '../../../../components/cms/admin-shell/AdminShell';
import { PluginHostRouteContainer } from '../../../../components/cms/plugins/plugin-host-route/PluginHostRouteContainer';

export const dynamic = 'force-dynamic';

interface IPageProps {
    params: { pluginId: string; slug: string };
}

export default function PluginAdminPage({ params }: IPageProps) {
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <PluginHostRouteContainer pluginId={params.pluginId} slug={params.slug} />
            </Suspense>
        </AdminShell>
    );
}
