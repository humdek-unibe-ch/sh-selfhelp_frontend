/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Emit the runtime-shim export-name manifest consumed by
 * `src/app/api/plugins/runtime-shim/runtime-shim.ts` in production.
 *
 * The shim route needs the export names of every allowlisted singleton
 * (`PLUGIN_RUNTIME_SHIM_SPECIFIERS`) to generate `export const <name> = …`
 * lines. In dev it enumerates them with a live `import()`, but the Next.js
 * standalone runtime image prunes `node_modules` down to what static
 * tracing sees — the shim's escape-hatch dynamic import is invisible to
 * tracing, so packages like `@selfhelp/shared` and `@mantine/core` are
 * absent at runtime and the import fails with a 500.
 *
 * This script runs in the Docker builder stage (full `node_modules`),
 * enumerates each module's exports with plain Node resolution, and writes
 * them as JSON into the standalone tree. The route prefers the manifest
 * and only falls back to dynamic import when it is absent (dev).
 *
 * Usage: node scripts/emit-runtime-shim-exports.mjs <output-path>
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PLUGIN_RUNTIME_SHIM_SPECIFIERS } from '@selfhelp/shared/plugin-sdk';

const outPath = process.argv[2];
if (!outPath) {
    console.error('usage: node scripts/emit-runtime-shim-exports.mjs <output-path>');
    process.exit(1);
}

const manifest = {};
for (const specifier of PLUGIN_RUNTIME_SHIM_SPECIFIERS) {
    const mod = await import(specifier);
    manifest[specifier] = {
        keys: Object.keys(mod).filter((k) => k !== 'default'),
        hasDefault: 'default' in mod,
    };
}

const resolved = path.resolve(outPath);
await mkdir(path.dirname(resolved), { recursive: true });
await writeFile(resolved, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
    `runtime-shim export manifest written: ${resolved} (${Object.keys(manifest).length} modules)`,
);
