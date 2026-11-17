/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { WEB_LIBRARIES } from '../web-libraries.utils';

/**
 * The website list is generated before dev, build and tsc and is not
 * committed. Vitest reads an empty list when the file has not been generated,
 * so this passes on a fresh checkout and checks the shape of the real file once
 * it exists.
 */
describe('WEB_LIBRARIES', () => {
    it('is a list of { name, version, license } items', () => {
        expect(Array.isArray(WEB_LIBRARIES)).toBe(true);
        for (const item of WEB_LIBRARIES) {
            expect(Object.keys(item).sort()).toEqual(['license', 'name', 'version']);
            expect(typeof item.name).toBe('string');
            expect(item.version === null || typeof item.version === 'string').toBe(true);
            expect(item.license === null || typeof item.license === 'string').toBe(true);
        }
    });

    it('is sorted by name with no duplicates', () => {
        const names = WEB_LIBRARIES.map((item) => item.name);
        expect(names).toEqual([...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
        expect(new Set(names).size).toBe(names.length);
    });
});
