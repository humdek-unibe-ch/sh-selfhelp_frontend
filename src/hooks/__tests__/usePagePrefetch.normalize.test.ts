/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Prefetch must normalize paths with shared `normalizePagesResolvePath` so the
 * React Query key matches SSR / browser resolve / Live Preview / mobile.
 */
import { describe, expect, it } from 'vitest';
import { normalizePagesResolvePath } from '@selfhelp/shared';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('usePagePrefetch path normalization', () => {
    it.each([
        ['/example', '/example'],
        ['/example/', '/example'],
        ['/example?x=1', '/example'],
        ['/example#section', '/example'],
        ['https://example.test/team/5?x=1#y', '/team/5'],
        ['/docs/a%20b', '/docs/a%20b'],
        ['/', '/'],
        ['', '/'],
        ['team/5', '/team/5'],
    ])('normalizePagesResolvePath(%j) → %j', (input, expected) => {
        expect(normalizePagesResolvePath(input)).toBe(expected);
    });

    it('hook source uses shared normalizePagesResolvePath (no local duplicate)', () => {
        const src = readFileSync(join(process.cwd(), 'src/hooks/usePagePrefetch.ts'), 'utf8');
        expect(src).toContain('normalizePagesResolvePath');
        expect(src).not.toMatch(/function normalizePublicPath/);
        expect(src).toMatch(/PAGE_BY_PATH\(\s*normalized/);
        expect(src).toContain('PageApi.resolvePageByPath(normalized');
    });
});
