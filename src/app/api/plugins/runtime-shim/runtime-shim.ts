/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import {
    PLUGIN_RUNTIME_GLOBAL_KEY,
    isPluginRuntimeShimSpecifier,
} from '@selfhelp/shared/plugin-sdk';

const dynamicImport = new Function(
    'specifier',
    'return import(specifier)',
) as (specifier: string) => Promise<Record<string, unknown>>;

const VALID_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function jsKey(name: string): string {
    return JSON.stringify(name);
}

/** Export surface of one allowlisted module, as the shim needs it. */
export interface IShimModuleExports {
    /** Named export identifiers (excluding `default`). */
    keys: string[];
    /** Whether the module has a `default` export. */
    hasDefault: boolean;
}

/**
 * Build-time export manifest (see `scripts/emit-runtime-shim-exports.mjs`).
 *
 * The standalone production image prunes `node_modules` down to what
 * Next's static tracing sees, so the escape-hatch `dynamicImport` above
 * cannot resolve the allowlisted packages there. The Docker builder stage
 * enumerates every allowlisted module's exports while the full
 * `node_modules` tree still exists and writes them next to `server.js`;
 * at runtime we read that file instead of importing. Dev (and any
 * environment with a full `node_modules`) falls back to live import.
 */
const EXPORT_MANIFEST_FILENAME = 'runtime-shim-exports.json';

let manifestPromise: Promise<Record<string, IShimModuleExports> | null> | undefined;

function loadExportManifest(): Promise<Record<string, IShimModuleExports> | null> {
    manifestPromise ??= readFile(path.join(process.cwd(), EXPORT_MANIFEST_FILENAME), 'utf8')
        .then((raw) => JSON.parse(raw) as Record<string, IShimModuleExports>)
        .catch(() => null);
    return manifestPromise;
}

async function resolveModuleExports(name: string): Promise<IShimModuleExports> {
    const manifest = await loadExportManifest();
    const fromManifest = manifest?.[name];
    if (fromManifest) {
        return fromManifest;
    }
    const mod = await dynamicImport(name);
    return {
        keys: Object.keys(mod).filter((k) => k !== 'default'),
        hasDefault: 'default' in mod,
    };
}

export function buildShim(moduleName: string, exports: IShimModuleExports): string {
    const keys = exports.keys.filter((k) => k !== 'default' && VALID_IDENTIFIER.test(k));
    const { hasDefault } = exports;

    const lines: string[] = [];
    lines.push(`/* runtime shim for ${moduleName} */`);
    lines.push(
        `const __M = (globalThis[${jsKey(PLUGIN_RUNTIME_GLOBAL_KEY)}] || {})[${jsKey(moduleName)}];`,
    );
    lines.push(`if (!__M) {`);
    lines.push(
        `  throw new Error('[plugin-runtime] host did not populate module: ${moduleName}. ' +`,
    );
    lines.push(
        `    'Make sure runtime-globals.client.ts imports it before any plugin loads.');`,
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

export async function buildRuntimeShimResponse(segments: string[]): Promise<NextResponse> {
    if (!Array.isArray(segments) || segments.length === 0) {
        return new NextResponse('/* missing module name */', {
            status: 400,
            headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
        });
    }
    const name = segments.map((s) => decodeURIComponent(s)).join('/');

    if (!isPluginRuntimeShimSpecifier(name)) {
        return new NextResponse(
            `/* runtime-shim: ${JSON.stringify(name)} is not on the allowlist */`,
            {
                status: 404,
                headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
            },
        );
    }

    let exportsObj: IShimModuleExports;
    try {
        exportsObj = await resolveModuleExports(name);
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

    return new NextResponse(buildShim(name, exportsObj), {
        status: 200,
        headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'public, max-age=300, immutable',
        },
    });
}
