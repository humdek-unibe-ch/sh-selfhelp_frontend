/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Plugin runtime — server-safe constants.
 *
 * Plugins ship as native ESM bundles whose imports — `react`,
 * `@mantine/core`, `@selfhelp/shared/plugin-sdk`, etc. — are
 * declared as `peerDependencies` and therefore left as bare module
 * specifiers in the published bundle. The browser cannot resolve
 * those without help.
 *
 * Resolution strategy:
 *
 *   1. The root layout renders an `<script type="importmap">` tag
 *      pointing every supported bare specifier at a host-served
 *      shim under `/api/plugins/runtime-shim/<name>` (see
 *      `src/app/api/plugins/runtime-shim/[...moduleName]/route.ts`).
 *   2. Each shim re-exports from
 *      `globalThis.__SELFHELP_RUNTIME__[<name>]`.
 *   3. The host populates that global with the EXACT module
 *      instances Webpack already loaded (see
 *      `runtime-globals.client.ts`). Plugins consume the host's
 *      singletons — no duplicate React, no duplicate
 *      `STYLE_REGISTRY`, no two copies of `MantineProvider`.
 *
 * The canonical list of supported bare specifiers lives in
 * `@selfhelp/shared/plugin-sdk` so plugin builds and this host
 * cannot drift. Adding or removing a singleton is a single edit to
 * `PLUGIN_RUNTIME_SHIM_SPECIFIERS` over there — the host then needs
 * a matching `import * as` + stash assignment in
 * `runtime-globals.client.ts`. The route allowlist and the import
 * map below are both derived from the shared list automatically.
 *
 * This module deliberately contains no `import * as foo from 'bar'`
 * statements so it is safe to import from Server Components like
 * `layout.tsx`. The actual module references live in
 * `runtime-globals.client.ts`, which is a Client-only module.
 */

import {
    PLUGIN_RUNTIME_GLOBAL_KEY as SHARED_PLUGIN_RUNTIME_GLOBAL_KEY,
    PLUGIN_RUNTIME_IMPORT_MAP as SHARED_PLUGIN_RUNTIME_IMPORT_MAP,
    PLUGIN_RUNTIME_SHIM_SPECIFIERS,
    type TPluginRuntimeShimSpecifier,
} from '@selfhelp/shared/plugin-sdk';

export const PLUGIN_RUNTIME_GLOBAL_KEY = SHARED_PLUGIN_RUNTIME_GLOBAL_KEY;

/**
 * Bare-specifier → shim URL map rendered into the SSR `<script
 * type="importmap">` tag (see `PluginRuntimeImportMapInjector`).
 * Sourced from the shared SDK so the import map, the
 * `globalThis.__SELFHELP_RUNTIME__` stash, and the
 * `/api/plugins/runtime-shim/*` allowlist all describe the same set
 * of singletons.
 */
export const PLUGIN_RUNTIME_IMPORT_MAP: Record<string, string> = {
    ...SHARED_PLUGIN_RUNTIME_IMPORT_MAP,
};

/**
 * Re-export the canonical list so other host-side modules
 * (notably the runtime-shim route handler) can validate incoming
 * specifiers without importing the shared package twice.
 */
export { PLUGIN_RUNTIME_SHIM_SPECIFIERS };
export type { TPluginRuntimeShimSpecifier };
