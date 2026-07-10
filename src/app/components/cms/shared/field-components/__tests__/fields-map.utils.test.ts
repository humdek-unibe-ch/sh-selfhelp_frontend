/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    parseFieldsMapFromJson,
    serializeFieldsMapToJson,
    parseFieldsMapCatalog,
    serializeFieldsMapCatalog,
    parseFieldsMapLabels,
    serializeFieldsMapLabels,
} from '../fields-map.utils';

describe('fields-map utils', () => {
    it('round-trips legacy column mapping entries via catalog helpers', () => {
        const entries = [
            { field_name: 'name', field_new_name: 'Name' },
            { field_name: 'email', field_new_name: 'Email' },
        ];
        expect(parseFieldsMapFromJson(serializeFieldsMapToJson(entries))).toEqual([
            { field_name: 'name', field_new_name: '' },
            { field_name: 'email', field_new_name: '' },
        ]);
    });

    it('serializes and parses ordered field_key catalog', () => {
        const keys = ['section_12', 'section_34'];
        expect(parseFieldsMapCatalog(serializeFieldsMapCatalog(keys))).toEqual(keys);
    });

    it('parses legacy object-shaped catalog entries', () => {
        const raw = JSON.stringify([{ field_name: 'name', field_new_name: 'Name' }]);
        expect(parseFieldsMapCatalog(raw)).toEqual(['name']);
    });

    it('round-trips per-locale header labels', () => {
        const labels = { section_12: 'Name', section_34: 'Email' };
        expect(parseFieldsMapLabels(serializeFieldsMapLabels(labels))).toEqual(labels);
    });

    it('returns an empty list for blank or invalid JSON', () => {
        expect(parseFieldsMapFromJson('')).toEqual([]);
        expect(parseFieldsMapFromJson('not-json')).toEqual([]);
        expect(parseFieldsMapCatalog('not-json')).toEqual([]);
        expect(parseFieldsMapLabels('not-json')).toEqual({});
    });
});
