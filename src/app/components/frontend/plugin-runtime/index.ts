/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export { PluginRuntime, getPluginRuntime, _resetPluginRuntime } from './PluginRuntime';
export type {
    IPluginManifest,
    IPluginManifestEntry,
    IPluginRuntimeSnapshot,
    IPluginRuntimeOptions,
    IPluginVersionWarning,
    TPluginStyleComponent,
    TPluginFieldRendererComponent,
    TPluginVersionWarningKind,
} from './PluginRuntime';
export {
    PluginsProvider,
    usePluginRuntime,
    usePluginStyleComponent,
    usePluginFieldRenderer,
    usePluginAdminPages,
    usePluginMenuItems,
    usePluginFeatureFlags,
    usePluginVersionWarnings,
} from './PluginsProvider';

/**
 * Re-export the universal Mercure subscription hook from the shared
 * plugin SDK. Plugins that contribute admin pages or styles to this
 * frontend can import it directly from this barrel so they do not need
 * to take a peer dependency on `@selfhelp/shared/plugin-sdk` themselves.
 *
 * BFF wiring: the hook expects same-origin SSE under
 * `/api/plugins/events`. The Next.js BFF route at
 * `src/app/api/plugins/events/route.ts` proxies the connection to the
 * Symfony plugin topic bootstrap endpoint (`/cms-api/v1/auth/events`)
 * and the Mercure hub, multiplexing every plugin topic IRI the user
 * is allowed to subscribe to. The route returns 204 when no topics
 * are granted so the EventSource stops cleanly.
 */
export { usePluginRealtime } from '@selfhelp/shared/plugin-sdk';
export type {
    IUsePluginRealtimeOptions,
    IUsePluginRealtimeResult,
    IRealtimeTransport,
    TRealtimeTransportFactory,
} from '@selfhelp/shared/plugin-sdk';
