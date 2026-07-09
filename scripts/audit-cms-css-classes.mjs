/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Audit CMS `css` / `css_mobile` tokens in importable examples against the
 * Tailwind v4 safelist in `src/globals.css`.
 *
 * Coverage model:
 * 1. @source on examples JSON — bundle/section JSON is scanned at build.
 * 2. `@source inline(...)` brace patterns — author-typed CMS classes from the DB.
 *
 * This script fails when a **web** class from examples is missing from both
 * the expanded inline safelist and the examples @source directive. Mobile-only
 * Uniwind tokens (`px-md`, `gap-sm`, …) are reported separately and skipped
 * for the web Tailwind gate.
 *
 * Usage:
 *   node scripts/audit-cms-css-classes.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');
const GLOBALS_CSS = join(REPO_ROOT, 'src', 'globals.css');
const EXAMPLES_DIR = join(REPO_ROOT, 'examples');

const MOBILE_TOKEN = /^(px|py|p|m|mx|my|mt|mb|ml|mr|gap)-(xs|sm|md|lg|xl|2xl)$/;

function expandPattern(pattern) {
    const results = new Set();
    function expand(value) {
        const match = value.match(/\{([^}]+)\}/);
        if (!match) {
            results.add(value);
            return;
        }
        for (const option of match[1].split(',')) {
            expand(value.replace(match[0], option));
        }
    }
    expand(pattern);
    return results;
}

export function parseGlobalsCss(cssText) {
    const inlineBlocks = [...cssText.matchAll(/@source inline\("([^"]+)"\)/g)].map((m) => m[1]);
    const safelist = new Set();
    for (const block of inlineBlocks) {
        for (const token of block.split(/\s+/)) {
            if (!token) continue;
            if (token.includes('{')) {
                for (const expanded of expandPattern(token)) {
                    safelist.add(expanded);
                }
            } else {
                safelist.add(token);
            }
        }
    }

    const examplesSource = /@source\s+"\.\.\/examples\/\*\*\/\*\.json"/.test(cssText);

    return { safelist, examplesSource };
}

function walkJsonFiles(dir) {
    const files = [];
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        const stat = statSync(path);
        if (stat.isDirectory()) {
            files.push(...walkJsonFiles(path));
        } else if (entry.endsWith('.json')) {
            files.push(path);
        }
    }
    return files;
}

export function collectExampleCssTokens(examplesDir = EXAMPLES_DIR) {
    const byClass = new Map();

    function collectFrom(node, file) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            for (const item of node) collectFrom(item, file);
            return;
        }
        for (const [key, value] of Object.entries(node)) {
            if ((key === 'css' || key === 'css_mobile') && typeof value === 'string' && value.trim()) {
                for (const token of value.trim().split(/\s+/).filter(Boolean)) {
                    if (!byClass.has(token)) byClass.set(token, new Set());
                    byClass.get(token).add(relative(REPO_ROOT, file));
                }
            } else {
                collectFrom(value, file);
            }
        }
    }

    for (const file of walkJsonFiles(examplesDir)) {
        try {
            collectFrom(JSON.parse(readFileSync(file, 'utf8')), file);
        } catch {
            // ignore invalid JSON in unrelated fixtures
        }
    }

    return byClass;
}

export function auditCmsCssClasses({
    globalsCssPath = GLOBALS_CSS,
    examplesDir = EXAMPLES_DIR,
} = {}) {
    const cssText = readFileSync(globalsCssPath, 'utf8');
    const { safelist, examplesSource } = parseGlobalsCss(cssText);
    const tokens = collectExampleCssTokens(examplesDir);

    const mobileTokens = [];
    const covered = [];
    const missing = [];

    for (const token of [...tokens.keys()].sort()) {
        if (MOBILE_TOKEN.test(token)) {
            mobileTokens.push(token);
            continue;
        }
        if (safelist.has(token)) {
            covered.push(token);
            continue;
        }
        if (examplesSource) {
            // Build-time @source on examples JSON covers literals in bundles.
            covered.push(token);
            continue;
        }
        missing.push({
            token,
            files: [...tokens.get(token)],
        });
    }

    return {
        examplesSource,
        safelistSize: safelist.size,
        totalTokens: tokens.size,
        mobileTokens,
        coveredCount: covered.length,
        missing,
    };
}

function main() {
    const result = auditCmsCssClasses();

    console.log(`Safelist patterns expanded to ${result.safelistSize} classes`);
    console.log(`Found ${result.totalTokens} unique css/css_mobile tokens in examples/`);
    console.log(`Mobile Uniwind tokens (web Tailwind gate skipped): ${result.mobileTokens.join(', ') || '(none)'}`);

    if (!result.examplesSource) {
        console.error('Missing @source "../examples/**/*.json" in src/globals.css');
        process.exitCode = 1;
    }

    if (result.missing.length > 0) {
        console.error(`\n${result.missing.length} web class(es) are not covered:`);
        for (const item of result.missing) {
            console.error(`  ${item.token} -> ${item.files.join(', ')}`);
        }
        process.exitCode = 1;
        return;
    }

    console.log('All example web CSS tokens are covered.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
