/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { resolveTableSelection } from '../DataAdminPage';

/**
 * Regression guard (canonical Testing Rule 2) for the data-table picker: with
 * "All data tables" selected, the user could not switch to a specific table —
 * the old logic stayed locked on `[-1]`. `resolveTableSelection` is the
 * extracted reducer; these cases pin the mutually-exclusive behaviour of the
 * "all" shortcut.
 */
const ALL = -1;

describe('resolveTableSelection', () => {
    it('collapses to [-1] when "all" is newly added alongside specifics', () => {
        // User had tables [1,2] and clicked "All data tables".
        expect(resolveTableSelection([1, 2, ALL], [1, 2])).toEqual([ALL]);
    });

    it('switches to the specific table when one is picked while "all" was active (the bug)', () => {
        // Previously [-1]; user clicks table 5 → MultiSelect emits [-1, 5].
        expect(resolveTableSelection([ALL, 5], [ALL])).toEqual([5]);
    });

    it('keeps a plain specific selection untouched', () => {
        expect(resolveTableSelection([3, 7], [3])).toEqual([3, 7]);
    });

    it('returns an empty selection when everything is cleared', () => {
        expect(resolveTableSelection([], [ALL])).toEqual([]);
    });

    it('selects "all" from an empty starting point', () => {
        expect(resolveTableSelection([ALL], [])).toEqual([ALL]);
    });
});
