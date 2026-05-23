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

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Bundler-opaque module loader. Both Webpack and Turbopack will
 * fail to resolve `require(name)` or `import(name)` when `name` is
 * an arbitrary string (the bundler tries to follow the import at
 * build time). Going through `Function` creates a runtime-only
 * function whose body the bundler does not analyse — Node's actual
 * runtime handles the resolution against `node_modules` as normal.
 */
const dynamicImport = new Function(
    'specifier',
    'return import(specifier)',
) as (specifier: string) => Promise<Record<string, unknown>>;

/**
 * Modules the host promises to populate on
 * `globalThis.__SELFHELP_RUNTIME__`. Mirrors the singletons listed in
 * `AGENTS.md` plus the small set of subpaths plugins actually consume.
 *
 * Adding a module here is a two-step change: also add an `import * as`
 * line in `runtime-globals.ts` so the host actually stashes it, and
 * add an entry in the import map rendered by `layout.tsx`.
 */
const ALLOWED_MODULES: ReadonlySet<string> = new Set([
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    '@mantine/core',
    '@mantine/hooks',
    '@tanstack/react-query',
    '@selfhelp/shared',
    '@selfhelp/shared/plugin-sdk',
    '@selfhelp/shared/registry',
]);

const VALID_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

/**
 * Quote a string for safe inclusion as a JS object-key access. We use
 * `JSON.stringify` so non-ASCII / special chars get escaped properly.
 */
function jsKey(name: string): string {
    return JSON.stringify(name);
}

function buildShim(moduleName: string, exports: Record<string, unknown>): string {
    const keys = Object.keys(exports).filter(
        (k) => k !== 'default' && VALID_IDENTIFIER.test(k),
    );
    const hasDefault = 'default' in exports;

    const lines: string[] = [];
    lines.push(`/* runtime shim for ${moduleName} */`);
    lines.push(`const __M = (globalThis.__SELFHELP_RUNTIME__ || {})[${jsKey(moduleName)}];`);
    lines.push(`if (!__M) {`);
    lines.push(
        `  throw new Error('[plugin-runtime] host did not populate module: ${moduleName}. ' +`,
    );
    lines.push(
        `    'Make sure runtime-globals.ts imports it before any plugin loads.');`,
    );
    lines.push(`}`);
    if (hasDefault) {
        lines.push(`const __default = __M.default !== undefined ? __M.default : __M;`);
        lines.push(`export default __default;`);
    } else {
        lines.push(`export default __M;`);
    }
    for (const k of keys) {
        lines.push(`export const ${k} = __M[${jsKey(k)}];`);
    }
    return lines.join('\n') + '\n';
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ moduleName: string[] }> },
): Promise<NextResponse> {
    const { moduleName: segments } = await params;
    if (!Array.isArray(segments) || segments.length === 0) {
        return new NextResponse('/* missing module name */', {
            status: 400,
            headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
        });
    }
    const name = segments.map((s) => decodeURIComponent(s)).join('/');

    if (!ALLOWED_MODULES.has(name)) {
        return new NextResponse(
            `/* runtime-shim: ${JSON.stringify(name)} is not on the allowlist */`,
            {
                status: 404,
                headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
            },
        );
    }

    let exportsObj: Record<string, unknown>;
    try {
        // Server-side resolution. Node's CJS resolver picks up
        // `node_modules/<name>` and reads the package's `exports` /
        // `main` field. CJS modules are wrapped with synthesized
        // `default` + named exports by Node's interop layer.
        exportsObj = await dynamicImport(name);
    } catch (err) {
        return new NextResponse(
            `/* runtime-shim: failed to resolve ${JSON.stringify(name)}: ${
                err instanceof Error ? err.message : String(err)
            } */`,
            {
                status: 500,
                headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
            },
        );
    }

    const body = buildShim(name, exportsObj);

    return new NextResponse(body, {
        status: 200,
        headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            // The shim itself never changes between requests within a
            // running server. Cache aggressively in the browser; a
            // server restart will issue new bundle URLs anyway.
            'Cache-Control': 'public, max-age=300, immutable',
        },
    });
}
