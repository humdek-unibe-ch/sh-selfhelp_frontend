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
