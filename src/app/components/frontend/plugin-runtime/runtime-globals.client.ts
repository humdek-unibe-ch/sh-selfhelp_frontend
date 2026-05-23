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
 * `react-dom/client` is intentionally imported here (not in
 * `runtime-globals.ts`) because Next.js refuses to import it from a
 * Server Component graph.
 */

import * as react from 'react';
import * as reactJsxRuntime from 'react/jsx-runtime';
import * as reactDom from 'react-dom';
import * as reactDomClient from 'react-dom/client';
import * as mantineCore from '@mantine/core';
import * as mantineHooks from '@mantine/hooks';
import * as reactQuery from '@tanstack/react-query';
import * as selfhelpShared from '@selfhelp/shared';
import * as selfhelpSharedPluginSdk from '@selfhelp/shared/plugin-sdk';
import * as selfhelpSharedRegistry from '@selfhelp/shared/registry';

interface IPluginRuntimeGlobals {
    [moduleName: string]: unknown;
}

declare global {
    interface Window {
        __SELFHELP_RUNTIME__?: IPluginRuntimeGlobals;
    }
}

let populated = false;

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
    const stash: IPluginRuntimeGlobals = window.__SELFHELP_RUNTIME__ ?? {};
    stash['react'] = react;
    stash['react/jsx-runtime'] = reactJsxRuntime;
    stash['react-dom'] = reactDom;
    stash['react-dom/client'] = reactDomClient;
    stash['@mantine/core'] = mantineCore;
    stash['@mantine/hooks'] = mantineHooks;
    stash['@tanstack/react-query'] = reactQuery;
    stash['@selfhelp/shared'] = selfhelpShared;
    stash['@selfhelp/shared/plugin-sdk'] = selfhelpSharedPluginSdk;
    stash['@selfhelp/shared/registry'] = selfhelpSharedRegistry;
    window.__SELFHELP_RUNTIME__ = stash;
    populated = true;
}
