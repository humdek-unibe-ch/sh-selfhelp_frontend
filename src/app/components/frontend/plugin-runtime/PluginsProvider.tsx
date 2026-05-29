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
 *   The provider does not poll. The Symfony backend publishes plugin
 *   lifecycle events on the admin plugin state Mercure topic; the
 *   frontend subscribes through `useAdminPluginsRealtime` (mounted in
 *   `RefineWrapper`) and invalidates the `plugins-manifest` query on
 *   every relevant event. Local admin mutations also call
 *   `queryClient.invalidateQueries({ queryKey: ['plugins-manifest'] })`
 *   directly so the optimistic refetch fires before the round-trip.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    getPluginRuntime,
    type IPluginManifest,
    type IPluginRuntimeSnapshot,
    type IPluginVersionWarning,
} from './PluginRuntime';
import { populatePluginRuntimeGlobals } from './runtime-globals.client';

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
    fieldRenderers: {},
    adminPages: [],
    menuItems: [],
    healthChecks: [],
    featureFlags: [],
    versionWarnings: [],
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
    const [isBooting, setIsBooting] = useState(false);

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
        setIsBooting(true);
        // Stash the host's singleton modules on `globalThis` BEFORE we
        // dynamically import any plugin bundle. The plugin bundle's
        // bare imports (react, @mantine/core, @selfhelp/shared/plugin-sdk,
        // …) hit the import map declared in `layout.tsx` and resolve
        // to `/api/plugins/runtime-shim/*`, which re-exports from
        // exactly this stash. Skipping this step makes the very first
        // plugin import throw "host did not populate module".
        populatePluginRuntimeGlobals();
        let cancelled = false;
        const unsubscribe = runtime.subscribe((next) => {
            if (!cancelled) setSnapshot(next);
        });
        runtime
            .boot(data)
            .then((next) => {
                if (!cancelled) setSnapshot(next);
            })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.error('[plugins-provider] boot failed', err);
            })
            .finally(() => {
                if (!cancelled) setIsBooting(false);
            });
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [data, runtime]);

    const value: IPluginsContextValue = useMemo(
        () => ({
            snapshot,
            isLoading: isLoading || isBooting,
            error: error instanceof Error ? error : undefined,
            isFeatureEnabled: (pluginId, flagKey) => runtime.isFeatureEnabled(pluginId, flagKey),
        }),
        [snapshot, isLoading, isBooting, error, runtime],
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

/**
 * Plugin-supplied editor component for a section field type. Returns
 * `undefined` when no plugin has registered a renderer for the field
 * type — callers should fall back to the host's built-in renderer.
 */
export function usePluginFieldRenderer(fieldType: string | null | undefined) {
    const { snapshot } = usePluginRuntime();
    if (!fieldType) return undefined;
    return snapshot.fieldRenderers[fieldType];
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

/**
 * Live list of plugin runtime warnings. Empty in a healthy
 * deployment; populated when the host manifest references a plugin
 * version that does not match the npm package the host actually
 * imports.
 */
export function usePluginVersionWarnings(): IPluginVersionWarning[] {
    const { snapshot } = usePluginRuntime();
    return snapshot.versionWarnings;
}
