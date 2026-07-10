/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it } from 'vitest';
import { buildColumnSelectOptions, withMissingColumnOptions } from '../column-option.utils';
import type { IDataTableColumn } from '../../../../../../types/responses/admin/data.types';

describe('column-option.utils', () => {
    it('shows display label and field key for duplicate-looking labels', () => {
        const columns: IDataTableColumn[] = [
            { id: 1, fieldKey: 'section_10', displayName: 'Name', locked: false },
            { id: 2, fieldKey: 'section_11', displayName: 'Name', locked: false },
        ];

        const options = buildColumnSelectOptions(columns);

        expect(options).toHaveLength(2);
        expect(options[0]?.label).toContain('section_10');
        expect(options[1]?.label).toContain('section_11');
    });

    it('keeps stale selected field keys visible as missing', () => {
        const options = withMissingColumnOptions(
            [{ value: 'record_id', label: 'record_id (standard)' }],
            ['record_id', 'section_999'],
        );

        expect(options).toEqual([
            { value: 'record_id', label: 'record_id (standard)' },
            { value: 'section_999', label: 'section_999 (missing column)' },
        ]);
    });
});
