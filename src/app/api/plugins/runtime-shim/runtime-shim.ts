/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

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

function buildShim(moduleName: string, exports: Record<string, unknown>): string {
    const keys = Object.keys(exports).filter(
        (k) => k !== 'default' && VALID_IDENTIFIER.test(k),
    );
    const hasDefault = 'default' in exports;

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

    let exportsObj: Record<string, unknown>;
    try {
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

    return new NextResponse(buildShim(name, exportsObj), {
        status: 200,
        headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'public, max-age=300, immutable',
        },
    });
}
