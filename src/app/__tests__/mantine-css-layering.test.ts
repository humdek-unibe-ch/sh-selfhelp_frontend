/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Regression guard for the CMS `css` escape hatch.
 *
 * Mantine **core** styles must be loaded ONLY through the *layered*
 * `@mantine/core/styles.layer.css` (pulled in by `globals.css`, landing in
 * `@layer mantine`). If any entry file ALSO imports the **unlayered**
 * `@mantine/core/styles.css`, those rules sit outside every cascade layer and
 * beat `@layer utilities`, which silently breaks author-picked Tailwind classes
 * in the section `css` field (e.g. `bg-blue-500` on a `card` stops working).
 *
 * This guards the fix in frontend v0.1.26. Keep it green.
 */
const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

const UNLAYERED_CORE = /@mantine\/core\/styles\.css['"]/;

describe('Mantine CSS cascade-layer integrity', () => {
    it.each([
        'src/app/layout.tsx',
        'src/app/[[...slug]]/SlugLayout/SlugShell.tsx',
    ])('%s does not import the unlayered @mantine/core/styles.css', (rel) => {
        expect(read(rel)).not.toMatch(UNLAYERED_CORE);
    });

    it('globals.css loads the layered @mantine/core/styles.layer.css', () => {
        expect(read('src/globals.css')).toContain('@mantine/core/styles.layer.css');
    });
});
