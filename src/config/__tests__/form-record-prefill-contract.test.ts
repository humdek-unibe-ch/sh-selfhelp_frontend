/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Behavioral contract: form-record prefill uses shared parseFormRecordPrefill
 * (ValidateStyle must not ship a second parser).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    flattenFormRecordPrefillValues,
    parseFormRecordPrefill,
} from '@selfhelp/shared';

const FIXTURE = {
    section_data: [
        {
            record_id: 42,
            id_users: 3,
            user_name: 'qa.user',
            id_languages: 1,
            title: 'Hello',
            notes: 'plain',
            nested: { ignored: true },
        },
    ],
    children: [
        { name: { content: 'title' }, translatable: { content: '0' } },
        { name: { content: 'notes' }, translatable: { content: '0' } },
    ],
};

describe('form-record prefill shared contract', () => {
    it('shared parser returns the canonical fixture result', () => {
        const prefill = parseFormRecordPrefill(FIXTURE);
        expect(prefill).toEqual({
            recordId: 42,
            values: { title: 'Hello', notes: 'plain' },
        });
        expect(flattenFormRecordPrefillValues(prefill.values)).toEqual({
            title: 'Hello',
            notes: 'plain',
        });
    });

    it('handles null, missing, empty, and malformed section_data consistently', () => {
        expect(parseFormRecordPrefill({})).toEqual({ recordId: null, values: {} });
        expect(parseFormRecordPrefill({ section_data: null })).toEqual({
            recordId: null,
            values: {},
        });
        expect(parseFormRecordPrefill({ section_data: [] })).toEqual({
            recordId: null,
            values: {},
        });
        expect(
            parseFormRecordPrefill({
                section_data: [null, 'skip', { record_id: 'nope' }],
            }),
        ).toEqual({ recordId: null, values: {} });
    });

    it('FormStyle consumes parseFormRecordPrefill; ValidateStyle does not reimplement it', () => {
        const formStyle = readFileSync(
            join(process.cwd(), 'src/app/components/frontend/styles/FormStyle.tsx'),
            'utf8',
        );
        const validateStyle = readFileSync(
            join(process.cwd(), 'src/app/components/frontend/styles/ValidateStyle.tsx'),
            'utf8',
        );
        expect(formStyle).toContain('parseFormRecordPrefill');
        expect(validateStyle).not.toContain('parseFormRecordPrefill');
        expect(validateStyle).not.toContain('section_data');
        expect(validateStyle).not.toContain('isRecord');
        expect(validateStyle).not.toContain('existingFormDataFromSection');
    });
});
