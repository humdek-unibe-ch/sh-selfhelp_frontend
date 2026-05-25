/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Plugin runtime ESM shim generator.
 *
 * Plugins ship as native ESM bundles that import bare specifiers like
 * `react`, `@mantine/core`, and `@selfhelp/shared/plugin-sdk`. The
 * browser cannot resolve those without help, and we explicitly do NOT
 * want each plugin to bundle its own copy of React or the SDK
 * (duplicate React breaks hooks; duplicate SDK breaks the singleton
 * style registry).
 *
 * This route serves a tiny per-module shim that re-exports from
 * `globalThis.__SELFHELP_RUNTIME__[<moduleName>]`. The host populates
 * that global with the same module instances Webpack already loaded
 * (see `runtime-globals.ts`), so plugins consume the host's
 * singletons.
 *
 * URL pattern:
 *   GET /api/plugins/runtime-shim/<moduleName>
 *
 *   moduleName supports `/` subpaths and `@scope/pkg` scoped names:
 *     /api/plugins/runtime-shim/react
 *     /api/plugins/runtime-shim/react/jsx-runtime
 *     /api/plugins/runtime-shim/@mantine/core
 *     /api/plugins/runtime-shim/@selfhelp/shared/plugin-sdk
 *
 * The browser's import map (rendered in `layout.tsx`) maps every
 * supported bare specifier to one of these URLs.
 *
 * Security: only the explicit allowlist below can be served. The
 * allowlist mirrors the host singletons documented in `AGENTS.md`
 * under `Host singleton peerDependencies`. Anything else returns 404.
 */

import { buildRuntimeShimResponse } from '../runtime-shim';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ moduleName: string[] }> },
) {
    const { moduleName: segments } = await params;
    return buildRuntimeShimResponse(segments);
}
