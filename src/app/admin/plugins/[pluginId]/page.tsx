/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../../components/shared/common/LoadingScreen';
import { PluginDetailPage } from '../../../components/cms/plugins';
import { AdminShell } from '../../../components/cms/admin-shell/AdminShell';

interface IPluginRouteParams {
    pluginId: string;
}

export async function generateMetadata({ params }: { params: Promise<IPluginRouteParams> }) {
    const { pluginId } = await params;
    return { title: `Plugin · ${decodeURIComponent(pluginId)}` };
}

export default async function AdminPluginDetailPage({ params }: { params: Promise<IPluginRouteParams> }) {
    const { pluginId } = await params;
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <PluginDetailPage pluginId={decodeURIComponent(pluginId)} />
            </Suspense>
        </AdminShell>
    );
}
