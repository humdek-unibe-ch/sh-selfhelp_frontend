/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { auditCmsCssClasses, collectExampleCssTokens, loadCmsCssCatalog, parseGlobalsCss } from '../../../../../../scripts/audit-cms-css-classes.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../../../..');

describe('CMS example CSS class audit', () => {
    it('registers examples JSON as a Tailwind @source', () => {
        const css = readFileSync(join(REPO_ROOT, 'src/globals.css'), 'utf8');
        const { catalogSource, examplesSource, safelist } = parseGlobalsCss(css);
        expect(examplesSource).toBe(true);
        expect(catalogSource).toBe(true);
        expect(safelist.size).toBe(0);
    });

    it('tracks the curated backend dropdown catalogue', () => {
        const catalog = loadCmsCssCatalog();
        expect(catalog).toHaveLength(1270);
        expect(catalog).toContain('aspect-video');
        expect(catalog).toContain('cursor-pointer');
        expect(catalog).toContain('md:gap-x-4');
        expect(catalog).toContain('motion-reduce:transition-none');
        expect(catalog).toContain('grid');
        expect(catalog).toContain('dark:hover:bg-slate-900');
        expect(catalog).toContain('xl:grid-cols-3');
    });

    it('collects css tokens from cms-in-cms bundles', () => {
        const tokens = collectExampleCssTokens();
        expect(tokens.has('grid')).toBe(true);
        expect(tokens.has('xl:grid-cols-3')).toBe(true);
        expect(tokens.has('gap-md')).toBe(true);
    });

    it('covers every web css token used by importable examples', () => {
        const result = auditCmsCssClasses();
        expect(result.missing, result.missing.map((m) => m.token).join(', ')).toEqual([]);
    });
});
