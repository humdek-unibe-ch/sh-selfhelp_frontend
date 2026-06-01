/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Suspense } from 'react';
import { LoadingScreen } from '../../../../components/shared/common/LoadingScreen';
import { AdminShell } from '../../../../components/cms/admin-shell/AdminShell';
import { PluginHostRouteContainer } from '../../../../components/cms/plugins/plugin-host-route/PluginHostRouteContainer';

export const dynamic = 'force-dynamic';

interface IPluginHostRouteParams {
    pluginId: string;
    slug: string;
}

// `params` is a Promise on Next.js 15+ / 16. The old synchronous shape
// resolved to `{}` at render time, so `pluginId` and `slug` arrived as
// `undefined` and `PluginHostRouteContainer` rendered the "Page not
// found at /" empty state for every plugin URL. Awaiting the promise
// matches the sibling `/admin/plugins/[pluginId]/page.tsx` pattern.
export async function generateMetadata({ params }: { params: Promise<IPluginHostRouteParams> }) {
    const { pluginId, slug } = await params;
    return { title: `Plugin · ${decodeURIComponent(pluginId)} · ${decodeURIComponent(slug)}` };
}

export default async function PluginAdminPage({ params }: { params: Promise<IPluginHostRouteParams> }) {
    const { pluginId, slug } = await params;
    return (
        <AdminShell>
            <Suspense fallback={<LoadingScreen />}>
                <PluginHostRouteContainer
                    pluginId={decodeURIComponent(pluginId)}
                    slug={decodeURIComponent(slug)}
                />
            </Suspense>
        </AdminShell>
    );
}
