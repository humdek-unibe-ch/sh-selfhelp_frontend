/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Writes the list of libraries this web app is really built with, for the
 * "about the platform" block of the `version` style and the admin System page.
 *
 * Source of truth: `package.json` `dependencies` (the production set, never
 * `devDependencies`) and, for each name, the `version` and `license` of the
 * package that is actually installed in `node_modules`. Nothing is typed by
 * hand, so the list cannot drift from the build.
 *
 * Output: `src/generated/web-libraries.json`, an array of
 * `{ name, version, license }` (the shared `IAboutItem` shape), sorted by name.
 * The file is generated, not committed (see `.gitignore`). The npm hooks
 * `predev`, `predev:fast`, `prebuild` and `pretsc` run this script, so every dev
 * server, build and type check starts from a fresh list. Tests do not need it:
 * `vitest.config.ts` falls back to an empty list when the file is missing.
 *
 * Run by hand: `node scripts/generate-web-libraries.mjs`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');

export const WEB_LIBRARIES_OUTPUT = join(REPO_ROOT, 'src', 'generated', 'web-libraries.json');

/**
 * One licence string for an installed package, or `null` when it declares none.
 *
 * npm packages write the licence as an SPDX string (`MIT`, `(MIT OR Apache-2.0)`),
 * the older `{ type }` object, or the deprecated `licenses: [{ type }]` array.
 * Several licences are joined with ` OR `, the same convention the backend uses
 * for its own list.
 *
 * @param {Record<string, unknown>} pkg Parsed `package.json` of the installed package.
 * @returns {string | null}
 */
export function normalizeLicense(pkg) {
    const types = [];
    const pushType = (value) => {
        if (typeof value === 'string' && value.trim() !== '') {
            types.push(value.trim());
        } else if (value && typeof value === 'object' && typeof value.type === 'string' && value.type.trim() !== '') {
            types.push(value.type.trim());
        }
    };

    pushType(pkg.license);
    if (types.length === 0 && Array.isArray(pkg.licenses)) {
        pkg.licenses.forEach(pushType);
    }

    return types.length === 0 ? null : [...new Set(types)].join(' OR ');
}

/**
 * Builds the list from a `package.json` and an install directory.
 *
 * A dependency that is not installed is left out and returned in `missing`,
 * because the list must say what is really installed, not what is declared.
 *
 * @param {{ packageJsonPath?: string, nodeModulesDir?: string }} [options]
 * @returns {{ items: { name: string, version: string | null, license: string | null }[], missing: string[] }}
 */
export function collectWebLibraries({
    packageJsonPath = join(REPO_ROOT, 'package.json'),
    nodeModulesDir = join(REPO_ROOT, 'node_modules'),
} = {}) {
    const root = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const names = Object.keys(root.dependencies ?? {});

    const items = [];
    const missing = [];
    for (const name of names) {
        // Read the file directly: `require.resolve('<pkg>/package.json')` is
        // blocked by packages whose `exports` map hides it.
        const file = join(nodeModulesDir, ...name.split('/'), 'package.json');
        if (!existsSync(file)) {
            missing.push(name);
            continue;
        }
        const installed = JSON.parse(readFileSync(file, 'utf8'));
        items.push({
            name,
            version: typeof installed.version === 'string' && installed.version !== '' ? installed.version : null,
            license: normalizeLicense(installed),
        });
    }

    // Plain code-unit order: the same result on every machine and locale.
    items.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    return { items, missing };
}

/**
 * Writes the list as pretty JSON (stable bytes, trailing newline).
 *
 * @param {{ name: string, version: string | null, license: string | null }[]} items
 * @param {string} [outputPath]
 */
export function writeWebLibraries(items, outputPath = WEB_LIBRARIES_OUTPUT) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(items, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const { items, missing } = collectWebLibraries();
    writeWebLibraries(items);
    console.log(`Wrote ${items.length} web libraries to ${WEB_LIBRARIES_OUTPUT}`);
    if (missing.length > 0) {
        // Not fatal: a checkout without `npm ci` still builds with a shorter list.
        console.warn(`Not installed, left out of the list: ${missing.join(', ')}`);
    }
}
