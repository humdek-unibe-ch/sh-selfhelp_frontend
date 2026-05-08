#!/usr/bin/env node
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * One-shot fixer for the curated AI-generated example JSONs.
 *
 * Why this script exists:
 *   The backend's import validator rejects two patterns we accidentally
 *   shipped in the showcase JSONs:
 *
 *     1. `mantine_wrap` is only valid on `flex`. On `group` the field is
 *        named `mantine_group_wrap` and takes `'0'`/`'1'` (off/on),
 *        not Mantine's `'wrap'`/`'nowrap'`/`'wrap-reverse'` keywords.
 *
 *     2. `mantine_spacing` is not registered in the backend `fields`
 *        table at all (Mantine's `SimpleGrid spacing` prop maps to the
 *        editor field `mantine_vertical_spacing` only — the renderer
 *        falls back to `'sm'` for horizontal gap when nothing is set).
 *
 * Run from the repo root:
 *   node scripts/fix-ai-examples.mjs
 *
 * The script is idempotent — already-fixed nodes are left alone.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const EXAMPLES_DIR = join(__dirname, '..', 'docs', 'AI Prompts', 'generated examples');

const WRAP_VALUE_TO_FLAG = {
    wrap: '1',
    nowrap: '0',
    'wrap-reverse': '1',
};

let fixCount = 0;

function fixNode(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        node.forEach(fixNode);
        return;
    }

    if (node.style_name === 'group' && node.fields?.mantine_wrap) {
        const value = node.fields.mantine_wrap?.all?.content;
        const flag = WRAP_VALUE_TO_FLAG[value] ?? '1';
        delete node.fields.mantine_wrap;
        node.fields.mantine_group_wrap = { all: { content: flag } };
        fixCount += 1;
    }

    if (node.style_name === 'simple-grid' && node.fields?.mantine_spacing) {
        delete node.fields.mantine_spacing;
        fixCount += 1;
    }

    if (Array.isArray(node.children)) {
        node.children.forEach(fixNode);
    }
    if (node.fields && typeof node.fields === 'object') {
        Object.values(node.fields).forEach(fixNode);
    }
}

async function main() {
    const files = (await readdir(EXAMPLES_DIR)).filter((f) => f.endsWith('.json'));
    for (const file of files) {
        const path = join(EXAMPLES_DIR, file);
        const before = fixCount;
        const json = JSON.parse(await readFile(path, 'utf8'));
        if (Array.isArray(json)) json.forEach(fixNode);
        else fixNode(json);
        const fixesInFile = fixCount - before;
        if (fixesInFile > 0) {
            await writeFile(path, JSON.stringify(json, null, 2) + '\n', 'utf8');
            console.log(`fixed ${fixesInFile} node(s) in ${file}`);
        } else {
            console.log(`no changes in ${file}`);
        }
    }
    console.log(`\nTotal nodes fixed: ${fixCount}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
