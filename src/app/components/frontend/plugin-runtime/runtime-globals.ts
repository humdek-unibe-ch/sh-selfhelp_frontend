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
 * This module deliberately contains no `import * as foo from 'bar'`
 * statements so it is safe to import from Server Components like
 * `layout.tsx`. The actual module references live in
 * `runtime-globals.client.ts`, which is a Client-only module.
 *
 * Adding a new singleton:
 *   - Add the bare specifier + URL to `PLUGIN_RUNTIME_IMPORT_MAP`.
 *   - Add the matching `import * as` + stash assignment in
 *     `runtime-globals.client.ts`.
 *   - Add the matching entry in `ALLOWED_MODULES` in
 *     `src/app/api/plugins/runtime-shim/[...moduleName]/route.ts`.
 */

export const PLUGIN_RUNTIME_GLOBAL_KEY = '__SELFHELP_RUNTIME__';

/**
 * Bare-specifier → shim URL map. Rendered as the body of the
 * `<script type="importmap">` tag in `layout.tsx`. Keys are the
 * literal strings plugins use in `import` statements.
 */
export const PLUGIN_RUNTIME_IMPORT_MAP: Record<string, string> = {
    react: '/api/plugins/runtime-shim/react',
    'react/jsx-runtime': '/api/plugins/runtime-shim/react/jsx-runtime',
    'react-dom': '/api/plugins/runtime-shim/react-dom',
    'react-dom/client': '/api/plugins/runtime-shim/react-dom/client',
    '@mantine/core': '/api/plugins/runtime-shim/@mantine/core',
    '@mantine/hooks': '/api/plugins/runtime-shim/@mantine/hooks',
    '@tanstack/react-query': '/api/plugins/runtime-shim/@tanstack/react-query',
    '@selfhelp/shared': '/api/plugins/runtime-shim/@selfhelp/shared',
    '@selfhelp/shared/plugin-sdk': '/api/plugins/runtime-shim/@selfhelp/shared/plugin-sdk',
    '@selfhelp/shared/registry': '/api/plugins/runtime-shim/@selfhelp/shared/registry',
};
