/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Tests for the shared section-import result probes. These were extracted from
 * two identical ~13-line blocks in `useSectionOperations` (audit Finding 5) so
 * the page- and section-level import handlers share one runtime contract. The
 * tests pin the documented shape precedence so future shape changes are
 * deliberate, not accidental.
 */
import { describe, it, expect } from 'vitest';
import {
    extractImportedSectionIds,
    extractCreatedSectionId,
} from '../section-operations.utils';

describe('extractImportedSectionIds', () => {
    it('prefers the data.sections envelope shape', () => {
        const result = { data: { sections: [{ id: 1 }, { id: 2 }] }, sections: [{ id: 99 }] };
        expect(extractImportedSectionIds(result)).toEqual([1, 2]);
    });

    it('falls back through data.importedSections then data.sectionIds', () => {
        expect(extractImportedSectionIds({ data: { importedSections: [{ id: 3 }] } })).toEqual([3]);
        expect(extractImportedSectionIds({ data: { sectionIds: [4, 5] } })).toEqual([4, 5]);
    });

    it('falls back to the top-level shapes when no data envelope is present', () => {
        expect(extractImportedSectionIds({ sections: [{ id: 6 }] })).toEqual([6]);
        expect(extractImportedSectionIds({ importedSections: [{ id: 7 }] })).toEqual([7]);
        expect(extractImportedSectionIds({ sectionIds: [8] })).toEqual([8]);
    });

    it('drops falsy ids from object-array shapes', () => {
        expect(extractImportedSectionIds({ sections: [{ id: 0 }, { id: 9 }] })).toEqual([9]);
    });

    it('returns an empty array for unknown / empty shapes', () => {
        expect(extractImportedSectionIds(undefined)).toEqual([]);
        expect(extractImportedSectionIds(null)).toEqual([]);
        expect(extractImportedSectionIds({})).toEqual([]);
        expect(extractImportedSectionIds({ data: {} })).toEqual([]);
        expect(extractImportedSectionIds('nope')).toEqual([]);
    });
});

describe('extractCreatedSectionId', () => {
    it('reads a top-level id', () => {
        expect(extractCreatedSectionId({ id: 42 })).toBe(42);
    });

    it('falls back to a nested section.id', () => {
        expect(extractCreatedSectionId({ section: { id: 13 } })).toBe(13);
    });

    it('returns undefined when no id is present', () => {
        expect(extractCreatedSectionId({})).toBeUndefined();
        expect(extractCreatedSectionId(undefined)).toBeUndefined();
        expect(extractCreatedSectionId({ section: {} })).toBeUndefined();
    });
});
