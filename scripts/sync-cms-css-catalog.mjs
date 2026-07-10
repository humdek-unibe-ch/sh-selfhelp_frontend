/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');
const DEFAULT_BACKEND_CATALOG = join(REPO_ROOT, '..', 'sh-selfhelp_backend', 'public', 'assets', 'tailwind-classes.json');
const OUTPUT = join(REPO_ROOT, 'src', 'config', 'cms-tailwind-classes.json');

const args = process.argv.slice(2);
const check = args.includes('--check');
const catalogArg = args.find((arg) => arg !== '--check');
const backendCatalog = catalogArg ? resolve(catalogArg) : DEFAULT_BACKEND_CATALOG;

const options = JSON.parse(readFileSync(backendCatalog, 'utf8'));
if (!Array.isArray(options)) {
    throw new Error(`Expected an array in ${backendCatalog}`);
}

const classes = [...new Set(options.map((option) => option?.value).filter((value) => typeof value === 'string' && value.length > 0))].sort();
if (classes.length !== options.length) {
    throw new Error('Backend CSS catalogue contains missing or duplicate class values');
}

const generated = `${JSON.stringify(classes, null, 2)}\n`;
if (check) {
    const current = readFileSync(OUTPUT, 'utf8');
    if (current !== generated) {
        throw new Error('Frontend CMS CSS catalogue is stale; run npm run sync:cms-css');
    }
    console.log(`CMS CSS catalogue is synchronized (${classes.length} classes).`);
} else {
    writeFileSync(OUTPUT, generated);
    console.log(`Synchronized ${classes.length} CMS CSS classes from ${backendCatalog}`);
}
