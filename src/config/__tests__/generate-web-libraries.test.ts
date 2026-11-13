/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The website list of the "about the platform" block is generated from the
 * app's own dependencies (`scripts/generate-web-libraries.mjs`). These tests pin
 * the rules that keep it true: production dependencies only, the installed
 * version (not the declared range), a licence in whatever form npm packages
 * write it, and a stable, sorted output.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    collectWebLibraries,
    normalizeLicense,
    writeWebLibraries,
} from '../../../scripts/generate-web-libraries.mjs';

let workDir: string;

/** Creates `<workDir>/node_modules/<name>/package.json` the way npm installs it. */
function install(name: string, manifest: Record<string, unknown>): void {
    const dir = join(workDir, 'node_modules', ...name.split('/'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, ...manifest }));
}

function writeRoot(manifest: Record<string, unknown>): string {
    const file = join(workDir, 'package.json');
    writeFileSync(file, JSON.stringify(manifest));
    return file;
}

function collect() {
    return collectWebLibraries({
        packageJsonPath: join(workDir, 'package.json'),
        nodeModulesDir: join(workDir, 'node_modules'),
    });
}

beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'sh-web-libraries-'));
});

afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
});

describe('collectWebLibraries', () => {
    it('lists the production dependencies sorted by name, with installed version and licence', () => {
        writeRoot({
            dependencies: { zeta: '^1.0.0', '@scope/alpha': '^2.0.0', beta: '^3.0.0' },
            devDependencies: { 'dev-only': '^9.0.0' },
        });
        install('zeta', { version: '1.0.0', license: 'ISC' });
        install('@scope/alpha', { version: '2.0.0', license: 'MIT' });
        install('beta', { version: '3.1.0', license: 'Apache-2.0' });
        install('dev-only', { version: '9.0.0', license: 'MIT' });

        const { items, missing } = collect();

        expect(items).toEqual([
            { name: '@scope/alpha', version: '2.0.0', license: 'MIT' },
            { name: 'beta', version: '3.1.0', license: 'Apache-2.0' },
            { name: 'zeta', version: '1.0.0', license: 'ISC' },
        ]);
        expect(missing).toEqual([]);
    });

    it('never lists a dev dependency, even when it is installed', () => {
        writeRoot({ dependencies: { runtime: '^1.0.0' }, devDependencies: { vitest: '^3.0.0' } });
        install('runtime', { version: '1.0.0', license: 'MIT' });
        install('vitest', { version: '3.2.6', license: 'MIT' });

        expect(collect().items.map((item) => item.name)).toEqual(['runtime']);
    });

    it('reports the installed version, not the declared range', () => {
        writeRoot({ dependencies: { lib: '^1.0.0' } });
        install('lib', { version: '1.4.2', license: 'MIT' });

        expect(collect().items[0].version).toBe('1.4.2');
    });

    it('leaves out a dependency that is not installed and reports it', () => {
        writeRoot({ dependencies: { present: '^1.0.0', ghost: '^1.0.0' } });
        install('present', { version: '1.0.0', license: 'MIT' });

        const { items, missing } = collect();

        expect(items.map((item) => item.name)).toEqual(['present']);
        expect(missing).toEqual(['ghost']);
    });

    it('gives an empty list when the project has no dependencies', () => {
        writeRoot({ name: 'bare' });

        expect(collect()).toEqual({ items: [], missing: [] });
    });

    it('uses null, never an invented value, for a missing licence or version', () => {
        writeRoot({ dependencies: { bare: '*' } });
        install('bare', {});

        expect(collect().items).toEqual([{ name: 'bare', version: null, license: null }]);
    });

    it('lists the real project: every production dependency, none of the dev ones', () => {
        const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
            dependencies: Record<string, string>;
            devDependencies: Record<string, string>;
        };

        const { items, missing } = collectWebLibraries();
        const names = items.map((item) => item.name);

        expect(missing).toEqual([]);
        expect(names).toEqual(Object.keys(pkg.dependencies).sort());
        for (const dev of Object.keys(pkg.devDependencies)) {
            expect(names).not.toContain(dev);
        }
        for (const item of items) {
            expect(item.version, `${item.name} has an installed version`).toMatch(/^\d+\.\d+\.\d+/);
        }
    });
});

describe('normalizeLicense', () => {
    it('keeps an SPDX id or expression as written', () => {
        expect(normalizeLicense({ license: 'MIT' })).toBe('MIT');
        expect(normalizeLicense({ license: '(MPL-2.0 OR Apache-2.0)' })).toBe('(MPL-2.0 OR Apache-2.0)');
    });

    it('reads the legacy { type } object', () => {
        expect(normalizeLicense({ license: { type: 'BSD-3-Clause', url: 'https://example.test' } })).toBe('BSD-3-Clause');
    });

    it('joins the deprecated licenses array with OR and drops duplicates', () => {
        expect(normalizeLicense({ licenses: [{ type: 'MIT' }, { type: 'Apache-2.0' }, { type: 'MIT' }] })).toBe(
            'MIT OR Apache-2.0',
        );
    });

    it('prefers the license field over the deprecated array', () => {
        expect(normalizeLicense({ license: 'ISC', licenses: [{ type: 'MIT' }] })).toBe('ISC');
    });

    it('returns null when nothing usable is declared', () => {
        expect(normalizeLicense({})).toBeNull();
        expect(normalizeLicense({ license: '   ' })).toBeNull();
        expect(normalizeLicense({ license: 42 })).toBeNull();
        expect(normalizeLicense({ licenses: [] })).toBeNull();
    });
});

describe('writeWebLibraries', () => {
    it('writes the shared item shape as stable JSON, creating the folder', () => {
        const target = join(workDir, 'src', 'generated', 'web-libraries.json');
        const items = [
            { name: 'a', version: '1.0.0', license: 'MIT' },
            { name: 'b', version: null, license: null },
        ];

        writeWebLibraries(items, target);

        const raw = readFileSync(target, 'utf8');
        expect(JSON.parse(raw)).toEqual(items);
        expect(raw.endsWith('\n')).toBe(true);
        // Same input, same bytes: a rerun never produces a diff.
        writeWebLibraries(items, target);
        expect(readFileSync(target, 'utf8')).toBe(raw);
    });
});
