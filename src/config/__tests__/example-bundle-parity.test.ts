/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Example bundles mirrored into the backend fixtures tree must stay byte-identical.
 * Frontend `examples/` is the authoring source; backend
 * `tests/fixtures/examples/` is the import/test copy.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FE_ROOT = process.cwd();
const BE_FIXTURES = join(FE_ROOT, '..', 'sh-selfhelp_backend', 'tests', 'fixtures', 'examples');

const PAIRS: Array<{ name: string; fe: string }> = [
    { name: 'menu-demo', fe: join('examples', 'navigation', 'menu-demo.bundle.json') },
    { name: 'hero-home', fe: join('examples', 'pages', 'hero-home.bundle.json') },
    { name: 'mobile-onboarding', fe: join('examples', 'pages', 'mobile-onboarding.bundle.json') },
    { name: 'contact-directory', fe: join('examples', 'cms-in-cms', 'contact-directory.bundle.json') },
    { name: 'events', fe: join('examples', 'cms-in-cms', 'events.bundle.json') },
    { name: 'faq', fe: join('examples', 'cms-in-cms', 'faq.bundle.json') },
    { name: 'news', fe: join('examples', 'cms-in-cms', 'news.bundle.json') },
    { name: 'team-members', fe: join('examples', 'cms-in-cms', 'team-members.bundle.json') },
    { name: 'testimonials', fe: join('examples', 'cms-in-cms', 'testimonials.bundle.json') },
];

function sha256(path: string): string {
    return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('example bundle byte parity (FE ↔ BE fixtures)', () => {
    it.each(PAIRS)('$name is byte-identical in backend fixtures', ({ name, fe }) => {
        const fePath = join(FE_ROOT, fe);
        const bePath = join(BE_FIXTURES, `${name}.bundle.json`);
        expect(existsSync(fePath), `missing FE ${fePath}`).toBe(true);
        expect(existsSync(bePath), `missing BE ${bePath}`).toBe(true);
        expect(sha256(fePath)).toBe(sha256(bePath));
    });

    it.each([
        'menu-demo',
        'hero-home',
        'mobile-onboarding',
    ] as const)('%s carries the active-wave core_version 0.1.36', (name) => {
        const pair = PAIRS.find((p) => p.name === name);
        expect(pair).toBeDefined();
        const fePath = join(FE_ROOT, pair!.fe);
        const meta = JSON.parse(readFileSync(fePath, 'utf8')) as { core_version?: string };
        expect(meta.core_version).toBe('0.1.36');
    });
});
