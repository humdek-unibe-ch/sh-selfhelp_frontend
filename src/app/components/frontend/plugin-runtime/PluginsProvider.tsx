/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * `PluginsProvider` — top-level React provider that boots the
 * `PluginRuntime` and exposes its current snapshot to descendants.
 *
 * The provider:
 *   1. Fetches the live plugin manifest from `/cms-api/v1/plugins/manifest`
 *      via `useQuery` (cached + revalidated through React Query).
 *   2. Calls `pluginRuntime.boot()` whenever the manifest changes.
 *   3. Provides `usePluginRuntime()` to read the snapshot, and a few
 *      thin convenience hooks for components that only need a slice.
 *
 * No-polling policy:
 *   The provider does not poll. The Symfony backend publishes a
 *   `selfhelp/plugins/manifest` Mercure update on every successful
 *   install/update/enable/disable/uninstall operation; the frontend
 *   subscribes through `useAclEventStream` style and re-fetches when
 *   it sees the event. Initial wiring of that subscription lives in
 *   `useAdminPluginsRealtime` (Phase 3, follow-up). Until that wiring
 *   ships, the manifest is fetched once and React Query stale-while-
 *   revalidate behavior covers manual refreshes.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPluginRuntime, type IPluginManifest, type IPluginRuntimeSnapshot } from './PluginRuntime';

interface IPluginsContextValue {
    snapshot: IPluginRuntimeSnapshot;
    isLoading: boolean;
    error?: Error;
    /** Live feature-flag accessor — re-renders the consumer on flag updates. */
    isFeatureEnabled: (pluginId: string, flagKey: string) => boolean;
}

const EMPTY_SNAPSHOT: IPluginRuntimeSnapshot = {
    plugins: [],
    styleComponents: {},
    adminPages: [],
    menuItems: [],
    healthChecks: [],
    featureFlags: [],
};

const PluginsContext = createContext<IPluginsContextValue>({
    snapshot: EMPTY_SNAPSHOT,
    isLoading: false,
    isFeatureEnabled: () => false,
});

interface IPluginsProviderProps {
    /**
     * Optional API base URL override. Defaults to `/api` so the
     * call goes through the Next.js BFF proxy (which then forwards to
     * `/cms-api/v1/plugins/manifest` upstream). Direct `/cms-api/v1`
     * calls fail in the browser because the dev/edge server doesn't
     * route that path — only Symfony does, and the browser cannot
     * reach the upstream host directly without CORS.
     */
    apiBaseUrl?: string;
    /**
     * Initial manifest piped from a Server Component. When provided,
     * the runtime boots synchronously on first render and the React
     * Query refetch keeps the snapshot in sync.
     */
    initialManifest?: IPluginManifest;
    children: React.ReactNode;
}

async function fetchManifest(baseUrl: string): Promise<IPluginManifest> {
    const resp = await fetch(`${baseUrl}/plugins/manifest`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include',
    });
    if (!resp.ok) {
        throw new Error(`[plugins-provider] manifest fetch failed (${resp.status})`);
    }
    const json = (await resp.json()) as { data?: IPluginManifest };
    if (!json.data) {
        throw new Error('[plugins-provider] manifest response missing data envelope.');
    }
    return json.data;
}

function PluginsProvider({ apiBaseUrl = '/api', initialManifest, children }: IPluginsProviderProps) {
    const runtime = useMemo(() => getPluginRuntime(), []);
    const [snapshot, setSnapshot] = useState<IPluginRuntimeSnapshot>(EMPTY_SNAPSHOT);

    const { data, isLoading, error } = useQuery({
        queryKey: ['plugins-manifest', apiBaseUrl],
        queryFn: () => fetchManifest(apiBaseUrl),
        initialData: initialManifest,
        // The backend pushes invalidations via Mercure; we deliberately
        // keep this query "fresh" so React Query never polls on its
        // own. Manual refetches (admin install / enable) trigger
        // `queryClient.invalidateQueries(['plugins-manifest'])`.
        staleTime: Infinity,
        gcTime: 1000 * 60 * 30,
    });

    useEffect(() => {
        if (!data) return;
        let cancelled = false;
        runtime
            .boot(data)
            .then((next) => {
                if (!cancelled) setSnapshot(next);
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error('[plugins-provider] boot failed', err);
            });
        return () => {
            cancelled = true;
        };
    }, [data, runtime]);

    const value: IPluginsContextValue = useMemo(
        () => ({
            snapshot,
            isLoading,
            error: error instanceof Error ? error : undefined,
            isFeatureEnabled: (pluginId, flagKey) => runtime.isFeatureEnabled(pluginId, flagKey),
        }),
        [snapshot, isLoading, error, runtime],
    );

    return <PluginsContext.Provider value={value}>{children}</PluginsContext.Provider>;
}

export { PluginsProvider };

export function usePluginRuntime(): IPluginsContextValue {
    return useContext(PluginsContext);
}

export function usePluginStyleComponent(styleName: string) {
    const { snapshot } = usePluginRuntime();
    return snapshot.styleComponents[styleName];
}

export function usePluginAdminPages() {
    const { snapshot } = usePluginRuntime();
    return snapshot.adminPages;
}

export function usePluginMenuItems() {
    const { snapshot } = usePluginRuntime();
    return snapshot.menuItems;
}

export function usePluginFeatureFlags() {
    const { snapshot } = usePluginRuntime();
    return snapshot.featureFlags;
}
