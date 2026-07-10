/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it } from 'vitest';
import { normalizeDataSource } from '../DataConfigModal';

describe('normalizeDataSource', () => {
    it('fills missing optional arrays for minimal entry-list configs', () => {
        const normalized = normalizeDataSource({
            scope: 'entries',
            table: '@section:contacts-form',
            retrieve: 'all',
            current_user: false,
        });

        expect(normalized).toEqual({
            current_user: false,
            all_fields: true,
            scope: 'entries',
            table: '@section:contacts-form',
            retrieve: 'all',
            filter: '',
            fields: [],
            map_fields: [],
        });
    });

    it('preserves explicit field selections', () => {
        const normalized = normalizeDataSource({
            scope: 'record',
            table: '0000000042',
            retrieve: 'first',
            all_fields: false,
            fields: [{ field_name: 'title', field_holder: '', not_found_text: '' }],
            map_fields: [{ field_name: '_category_label', field_new_name: 'Category' }],
        });

        expect(normalized.all_fields).toBe(false);
        expect(normalized.fields).toHaveLength(1);
        expect(normalized.map_fields).toHaveLength(1);
    });
});
