/*

SPDX-FileCopyrightText: 2026 Humdek, University of Bern

SPDX-License-Identifier: MPL-2.0

*/

import { describe, expect, it } from 'vitest';

import { resolveNavMoreLabel } from '../headerNavLabels.utils';



describe('resolveNavMoreLabel', () => {

    it('returns German for de-CH', () => {

        expect(resolveNavMoreLabel('de-CH')).toBe('Mehr');

    });



    it('returns English for en-GB', () => {

        expect(resolveNavMoreLabel('en-GB')).toBe('More');

    });



    it('falls back from language prefix to a known locale', () => {

        expect(resolveNavMoreLabel('de-AT')).toBe('Mehr');

        expect(resolveNavMoreLabel('en-AU')).toBe('More');

    });



    it('defaults to English when locale is unknown', () => {

        expect(resolveNavMoreLabel('xx-YY')).toBe('More');

        expect(resolveNavMoreLabel(null)).toBe('More');

    });

});


