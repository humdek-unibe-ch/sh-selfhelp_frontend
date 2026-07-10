/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Release-manifest floor guard for the unreleased DB-routing / CMS-apps wave.
 * Registry pairing uses `supports.core` (not mobile package SemVer).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const manifest = JSON.parse(
    readFileSync(join(process.cwd(), 'release-manifest.json'), 'utf8'),
);
const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

describe('release-manifest wave floors', () => {
    it('requires core >=0.1.36 for this frontend', () => {
        expect(manifest.kind).toBe('frontend');
        expect(manifest.supports.core).toBe('>=0.1.36 <0.2.0');
    });

    it('pins @selfhelp/shared to 1.21.6 (not staged 2.x/3.x)', () => {
        expect(pkg.dependencies['@selfhelp/shared'] ?? pkg.devDependencies?.['@selfhelp/shared']).toBe(
            '1.21.6',
        );
    });
});
