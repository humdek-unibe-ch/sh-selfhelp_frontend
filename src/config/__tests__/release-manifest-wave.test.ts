/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Release-manifest floor guard for the live-sync wave (frontend 0.1.76, which
 * needs the change notices, the access stamp and the page `sync` block of core 0.1.49).
 * The same floor is the first core with the role-scope permission names (0.1.48) and with
 * `fully_held` on role items (0.1.49, F255).
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
    it('requires core >=0.1.49 for this frontend', () => {
        expect(manifest.kind).toBe('frontend');
        expect(manifest.supports.core).toBe('>=0.1.49 <0.2.0');
    });

    it('pins @selfhelp/shared to one exact published version', () => {
        // The number is not fixed here: a later bump needs only package.json and the lockfile.
        const pinned = pkg.dependencies['@selfhelp/shared'] ?? pkg.devDependencies?.['@selfhelp/shared'];
        expect(pinned).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('names the same shared version in the lockfile as in package.json', () => {
        const lock = JSON.parse(readFileSync(join(process.cwd(), 'package-lock.json'), 'utf8'));
        expect(lock.packages[''].dependencies['@selfhelp/shared']).toBe(pkg.dependencies['@selfhelp/shared']);
        expect(lock.packages['node_modules/@selfhelp/shared'].version).toBe(pkg.dependencies['@selfhelp/shared']);
        expect(lock.packages['node_modules/@selfhelp/shared'].resolved).toBe(
            `https://registry.npmjs.org/@selfhelp/shared/-/shared-${pkg.dependencies['@selfhelp/shared']}.tgz`,
        );
    });

    it('rejects pairing below the declared core floor via semver', () => {
        // Avoid importing `semver` (no @types in this package); mirror the
        // wave's `>=X.Y.Z <0.2.0` range with version_compare-style checks.
        const range = manifest.supports.core as string;
        expect(range).toBe('>=0.1.49 <0.2.0');
        const floorOk = (v: string) => {
            const [maj, min, pat] = v.split('.').map(Number);
            const [fMaj, fMin, fPat] = [0, 1, 49];
            const [cMaj, cMin] = [0, 2];
            const geFloor =
                maj > fMaj ||
                (maj === fMaj && min > fMin) ||
                (maj === fMaj && min === fMin && pat >= fPat);
            const ltCap = maj < cMaj || (maj === cMaj && min < cMin);
            return geFloor && ltCap;
        };
        expect(floorOk('0.1.49')).toBe(true);
        expect(floorOk('0.1.48')).toBe(false);
    });
});
