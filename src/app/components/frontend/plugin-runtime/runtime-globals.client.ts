/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Plugin runtime — client-only global stash population.
 *
 * Imports the host's singleton modules and copies them onto
 * `globalThis.__SELFHELP_RUNTIME__` so the runtime shims served by
 * `/api/plugins/runtime-shim/<name>` can re-export the exact same
 * module instances to plugin bundles. See `runtime-globals.ts` for
 * the full resolution strategy.
 *
 * `react-dom/client` and `react/jsx-dev-runtime` are intentionally
 * imported here (not in `runtime-globals.ts`) because Next.js refuses
 * to import them from a Server Component graph.
 *
 * The canonical list of singletons lives in `@selfhelp/shared/plugin-sdk`.
 * After updating the list there, add the matching `import * as` +
 * stash assignment below (and only here — the import map and the
 * route-handler allowlist are derived from the shared list
 * automatically).
 */

import * as react from 'react';
import * as reactJsxRuntime from 'react/jsx-runtime';
import * as reactJsxDevRuntime from 'react/jsx-dev-runtime';
import * as reactDom from 'react-dom';
import * as reactDomClient from 'react-dom/client';
import * as mantineCore from '@mantine/core';
import * as mantineHooks from '@mantine/hooks';
import * as mantineNotifications from '@mantine/notifications';
import * as reactQuery from '@tanstack/react-query';
import * as selfhelpShared from '@selfhelp/shared';
import * as selfhelpSharedPluginSdk from '@selfhelp/shared/plugin-sdk';
import * as selfhelpSharedRegistry from '@selfhelp/shared/registry';
import {
    PLUGIN_RUNTIME_SHIM_SPECIFIERS,
    type TPluginRuntimeShimSpecifier,
} from '@selfhelp/shared/plugin-sdk';

type IPluginRuntimeGlobals = Partial<Record<TPluginRuntimeShimSpecifier, unknown>>
    & Record<string, unknown>;

declare global {
    interface Window {
        __SELFHELP_RUNTIME__?: IPluginRuntimeGlobals;
    }
}

let populated = false;

/**
 * Mapping from the shared specifier list to the host's actual
 * module objects. Defining this as a typed const lets TypeScript
 * flag any drift between `PLUGIN_RUNTIME_SHIM_SPECIFIERS` and the
 * imports above — adding a new specifier to the shared list will
 * fail to compile here until the matching `import * as` lands.
 */
const HOST_SINGLETONS: Record<TPluginRuntimeShimSpecifier, unknown> = {
    react,
    'react/jsx-runtime': reactJsxRuntime,
    'react/jsx-dev-runtime': reactJsxDevRuntime,
    'react-dom': reactDom,
    'react-dom/client': reactDomClient,
    '@mantine/core': mantineCore,
    '@mantine/hooks': mantineHooks,
    '@mantine/notifications': mantineNotifications,
    '@tanstack/react-query': reactQuery,
    '@selfhelp/shared': selfhelpShared,
    '@selfhelp/shared/plugin-sdk': selfhelpSharedPluginSdk,
    '@selfhelp/shared/registry': selfhelpSharedRegistry,
};

/**
 * Stash the host's singleton modules on `globalThis`. Idempotent;
 * no-op outside the browser. Called once from `PluginsProvider`
 * before the runtime boots a plugin manifest.
 *
 * Module instances captured here are the SAME ones Webpack/Turbopack
 * resolved for the host bundle. Re-importing through the shim does
 * not allocate a second copy of React, `STYLE_REGISTRY`, or any
 * other singleton — the shim just looks the existing instance up.
 */
export function populatePluginRuntimeGlobals(): void {
    if (typeof window === 'undefined') {
        return;
    }
    if (populated) {
        return;
    }
    const existing = window.__SELFHELP_RUNTIME__;
    const stash: IPluginRuntimeGlobals = existing ?? {};
    for (const specifier of PLUGIN_RUNTIME_SHIM_SPECIFIERS) {
        stash[specifier] = HOST_SINGLETONS[specifier];
    }
    window.__SELFHELP_RUNTIME__ = stash;
    populated = true;
}
