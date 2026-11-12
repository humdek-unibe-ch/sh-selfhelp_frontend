/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { ariaSort } from '../SortHeader';

/** A4: sortable column headers report their sort state to screen readers. */
describe('ariaSort', () => {
    const column = (canSort: boolean, sorted: false | 'asc' | 'desc') => ({
        getCanSort: () => canSort,
        getIsSorted: () => sorted,
    });

    it('maps the sort state of a sortable column', () => {
        expect(ariaSort(column(true, 'asc'))).toBe('ascending');
        expect(ariaSort(column(true, 'desc'))).toBe('descending');
        expect(ariaSort(column(true, false))).toBe('none');
    });

    it('leaves columns that cannot be sorted without aria-sort', () => {
        expect(ariaSort(column(false, false))).toBeUndefined();
    });
});
