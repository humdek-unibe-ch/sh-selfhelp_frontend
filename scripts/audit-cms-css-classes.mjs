/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Audit CMS `css` / `css_mobile` tokens (and the `list_row_css` property of a
 * data view) in importable examples against the Tailwind v4 safelist in
 * `src/globals.css`. The classes of the compact and spacious presets documented in
 * `examples/cms-in-cms/README.md` are audited too, and strictly: a preset class must be
 * in the CMS class catalogue or already used by a bundle (the web build scans both),
 * because the README itself gives no class CSS.
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
const CATALOG = join(REPO_ROOT, 'src', 'config', 'cms-tailwind-classes.json');
const PRESET_README = join(EXAMPLES_DIR, 'cms-in-cms', 'README.md');
const PRESET_START = '<!-- class-presets:start -->';
const PRESET_END = '<!-- class-presets:end -->';

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
    const catalogSource = /@source\s+"\.\/config\/cms-tailwind-classes\.json"/.test(cssText);

    return { safelist, examplesSource, catalogSource };
}

export function loadCmsCssCatalog(catalogPath = CATALOG) {
    const values = JSON.parse(readFileSync(catalogPath, 'utf8'));
    if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
        throw new Error('CMS Tailwind catalogue must be an array of class strings');
    }
    return values;
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

/**
 * The class text a bundle field holds, or null when the entry is not a class field.
 * `css` / `css_mobile` are plain strings (global fields); `list_row_css`, the classes
 * of the element around the records of a data view, is a property field
 * (`{ all: { content } }`).
 */
function classesOf(key, value) {
    if ((key === 'css' || key === 'css_mobile') && typeof value === 'string' && value.trim()) {
        return value.trim();
    }
    if (key === 'list_row_css' && typeof value?.all?.content === 'string' && value.all.content.trim()) {
        return value.all.content.trim();
    }
    return null;
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
            const classes = classesOf(key, value);
            if (classes !== null) {
                for (const token of classes.split(/\s+/).filter(Boolean)) {
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

/**
 * The classes of the presets in the template README: the code spans in the Default, Compact and
 * Spacious cells of the table between the two markers (the first columns name the template and the
 * section, which are not classes).
 */
export function collectPresetCssTokens(readmePath = PRESET_README) {
    const text = readFileSync(readmePath, 'utf8').replace(/\r\n/g, '\n');
    const start = text.indexOf(PRESET_START);
    const end = text.indexOf(PRESET_END);
    const tokens = new Set();
    if (start === -1 || end === -1 || end < start) return tokens;

    for (const line of text.slice(start, end).split('\n')) {
        if (!line.startsWith('|')) continue;
        const cells = line.split('|').map((cell) => cell.trim());
        // cells: ['', template, section, default, compact, spacious, '']
        for (const cell of cells.slice(3, 6)) {
            for (const span of cell.matchAll(/`([^`]+)`/g)) {
                for (const token of span[1].split(/\s+/).filter(Boolean)) tokens.add(token);
            }
        }
    }

    return tokens;
}

export function auditCmsCssClasses({
    globalsCssPath = GLOBALS_CSS,
    examplesDir = EXAMPLES_DIR,
    catalogPath = CATALOG,
    presetReadmePath = PRESET_README,
} = {}) {
    const cssText = readFileSync(globalsCssPath, 'utf8');
    const { safelist, examplesSource, catalogSource } = parseGlobalsCss(cssText);
    const catalogValues = loadCmsCssCatalog(catalogPath);
    const catalog = new Set(catalogValues);
    const tokens = collectExampleCssTokens(examplesDir);
    const presetTokens = collectPresetCssTokens(presetReadmePath);
    // A preset class has CSS when the catalogue holds it or a bundle already uses it (the build scans both).
    const presetsMissing = [...presetTokens].filter((token) => !catalog.has(token) && !safelist.has(token) && !tokens.has(token)).sort();

    const mobileTokens = [];
    const covered = [];
    const missing = [];

    for (const token of [...tokens.keys()].sort()) {
        if (MOBILE_TOKEN.test(token)) {
            mobileTokens.push(token);
            continue;
        }
        if (catalog.has(token) || safelist.has(token)) {
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
        catalogSource,
        catalogSize: catalog.size,
        catalogSorted: catalogValues.every((value, index) => index === 0 || catalogValues[index - 1].localeCompare(value) < 0),
        safelistSize: safelist.size,
        totalTokens: tokens.size,
        mobileTokens,
        coveredCount: covered.length,
        missing,
        presetCount: presetTokens.size,
        presetsMissing,
    };
}

function main() {
    const result = auditCmsCssClasses();

    console.log(`Backend dropdown snapshot contains ${result.catalogSize} classes`);
    console.log(`Safelist patterns expanded to ${result.safelistSize} classes`);
    console.log(`Found ${result.totalTokens} unique css/css_mobile tokens in examples/`);
    console.log(`Mobile Uniwind tokens (web Tailwind gate skipped): ${result.mobileTokens.join(', ') || '(none)'}`);
    console.log(`Found ${result.presetCount} unique classes in the compact/spacious presets of the template README`);

    if (!result.examplesSource) {
        console.error('Missing @source "../examples/**/*.json" in src/globals.css');
        process.exitCode = 1;
    }
    if (!result.catalogSource) {
        console.error('Missing @source "./config/cms-tailwind-classes.json" in src/globals.css');
        process.exitCode = 1;
    }
    if (!result.catalogSorted) {
        console.error('CMS Tailwind catalogue must be sorted and contain no duplicates');
        process.exitCode = 1;
    }

    if (result.presetCount === 0) {
        console.error('The template README has no class presets between its class-presets markers');
        process.exitCode = 1;
    }
    if (result.presetsMissing.length > 0) {
        console.error(`\n${result.presetsMissing.length} preset class(es) of the template README are not in the CMS class catalogue:`);
        for (const token of result.presetsMissing) {
            console.error(`  ${token}`);
        }
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

    if (result.presetsMissing.length === 0 && result.presetCount > 0) {
        console.log('All preset classes of the template README have CSS (the CMS class catalogue or a bundle).');
    }
    console.log('All example web CSS tokens are covered.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
