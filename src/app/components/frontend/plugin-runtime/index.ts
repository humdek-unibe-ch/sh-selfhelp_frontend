/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export { PluginRuntime, getPluginRuntime, _resetPluginRuntime } from './PluginRuntime';
export type { IPluginManifest, IPluginManifestEntry, IPluginRuntimeSnapshot, IPluginRuntimeOptions, TPluginStyleComponent } from './PluginRuntime';
export {
    PluginsProvider,
    usePluginRuntime,
    usePluginStyleComponent,
    usePluginAdminPages,
    usePluginMenuItems,
    usePluginFeatureFlags,
} from './PluginsProvider';

/**
 * Re-export the universal Mercure subscription hook from the shared
 * plugin SDK. Plugins that contribute admin pages or styles to this
 * frontend can import it directly from this barrel so they do not need
 * to take a peer dependency on `@selfhelp/shared/plugin-sdk` themselves.
 *
 * BFF wiring: the hook expects same-origin SSE under
 * `/api/plugins/events?pluginId=...&topic=...`. The host BFF proxy that
 * forwards the request to the Symfony plugin topic bootstrap endpoint
 * (and back to Mercure) is tracked as a follow-up; until it lands, the
 * hook reports `isOnline: false` for plugin topics and consumers should
 * render an "offline" hint instead of polling.
 */
export { usePluginRealtime } from '@selfhelp/shared/plugin-sdk';
export type {
    IUsePluginRealtimeOptions,
    IUsePluginRealtimeResult,
    IRealtimeTransport,
    TRealtimeTransportFactory,
} from '@selfhelp/shared/plugin-sdk';
