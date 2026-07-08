/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { calculateVisibleItemCount } from '../headerNavOverflow.utils';

describe('calculateVisibleItemCount', () => {
    it('returns all items when the row is wide enough', () => {
        expect(calculateVisibleItemCount([80, 90, 70], 300, 60, 4)).toBe(3);
    });

    it('reserves space for the More control when later items would overflow', () => {
        expect(calculateVisibleItemCount([100, 100, 100], 250, 60, 4)).toBe(1);
    });

    it('moves every item into More when the row is too narrow', () => {
        expect(calculateVisibleItemCount([120, 120], 150, 60, 4)).toBe(0);
    });

    it('handles an empty item list', () => {
        expect(calculateVisibleItemCount([], 500, 60, 4)).toBe(0);
    });
});
