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

    it('pins @selfhelp/shared to 1.21.7 (should_fallback contract; not staged 2.x/3.x)', () => {
        expect(pkg.dependencies['@selfhelp/shared'] ?? pkg.devDependencies?.['@selfhelp/shared']).toBe(
            '1.21.7',
        );
    });

    it('rejects pairing below the declared core floor via semver', () => {
        // Avoid importing `semver` (no @types in this package); mirror the
        // wave's `>=X.Y.Z <0.2.0` range with version_compare-style checks.
        const range = manifest.supports.core as string;
        expect(range).toBe('>=0.1.36 <0.2.0');
        const floorOk = (v: string) => {
            const [maj, min, pat] = v.split('.').map(Number);
            const [fMaj, fMin, fPat] = [0, 1, 36];
            const [cMaj, cMin] = [0, 2];
            const geFloor =
                maj > fMaj ||
                (maj === fMaj && min > fMin) ||
                (maj === fMaj && min === fMin && pat >= fPat);
            const ltCap = maj < cMaj || (maj === cMaj && min < cMin);
            return geFloor && ltCap;
        };
        expect(floorOk('0.1.36')).toBe(true);
        expect(floorOk('0.1.35')).toBe(false);
    });
});
