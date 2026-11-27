/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Writes `docs/reference/admin-screens.json` from the admin screen registry
 * (`src/config/admin-screens.ts`). Run with `npm run access:screens`.
 *
 * The registry is TypeScript, so it is loaded through Vite (already a dev
 * dependency) instead of a second copy here. The text comes from
 * `renderAdminScreensJson()`, the same function the staleness test calls.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'docs/reference/admin-screens.json');

const { module } = await runnerImport(resolve(root, 'src/config/admin-screens.ts'), {
    root,
    configFile: false,
    logLevel: 'error',
});

mkdirSync(dirname(target), { recursive: true });
// Written as UTF-8 with `\n` line ends exactly as rendered (byte-stable).
writeFileSync(target, module.renderAdminScreensJson(), 'utf8');
console.warn(`Wrote ${target}`);
