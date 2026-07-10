/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { OptionCatalogEditor } from '../OptionCatalogEditor';
import {
    parseOptionEditorRows,
    serializeOptionEditorLabels,
    serializeOptionEditorRows,
    validateOptionEditorRows,
} from '../option-catalog-editor.utils';

const LANGUAGES = [
    { id: 2, language: 'German', locale: 'de-CH' },
    { id: 3, language: 'English', locale: 'en-GB' },
];

describe('option catalog editor contract', () => {
    it('loads legacy labels and reports row/language-specific validation errors', () => {
        const rows = parseOptionEditorRows(
            JSON.stringify([
                { value: 'release', text: 'Legacy release', sort: 1 },
                { value: 'release' },
                { value: 'invalid code' },
                { value: '' },
            ]),
            {
                2: JSON.stringify({ release: 'Freigabe' }),
                3: '{}',
            },
            LANGUAGES,
        );

        expect(rows[0]?.labels).toEqual({
            2: 'Freigabe',
            3: 'Legacy release',
        });
        expect(validateOptionEditorRows(rows, LANGUAGES).map((issue) => issue.message)).toEqual(
            expect.arrayContaining([
                'Row 2: code "release" duplicates row 1.',
                'Row 2, English (en-GB): label is required.',
                'Row 3: code "invalid code" may contain only letters, numbers, dot, underscore, and hyphen.',
                'Row 4: code is required.',
            ]),
        );
    });

    it('serializes stable codes separately from each language label map', () => {
        const rows = [{
            value: 'release',
            sort: '1',
            disabled: false,
            meta: { description: 'Release notes' },
            labels: { 2: 'Freigabe', 3: 'Release' },
        }];

        expect(JSON.parse(serializeOptionEditorRows(rows))).toEqual([
            {
                value: 'release',
                sort: 1,
                meta: { description: 'Release notes' },
            },
        ]);
        expect(JSON.parse(serializeOptionEditorLabels(rows, 2))).toEqual({
            release: 'Freigabe',
        });
    });

    it('renders one multilingual grid and writes both internal fields', () => {
        const onCatalogChange = vi.fn();
        const onLabelChange = vi.fn();
        renderWithProviders(
            <OptionCatalogEditor
                catalogValue={JSON.stringify([{ value: 'release', sort: 1 }])}
                labelValues={{
                    2: JSON.stringify({ release: 'Freigabe' }),
                    3: JSON.stringify({ release: 'Release' }),
                }}
                languages={LANGUAGES}
                onCatalogChange={onCatalogChange}
                onLabelChange={onLabelChange}
            />,
        );

        expect(screen.getByLabelText('Option 1 label for German')).toHaveValue('Freigabe');

        fireEvent.change(screen.getByLabelText('Option 1 code'), {
            target: { value: 'release-v2' },
        });

        expect(onCatalogChange).toHaveBeenLastCalledWith(expect.stringContaining('"value": "release-v2"'));
        expect(onLabelChange).toHaveBeenCalledWith(2, expect.stringContaining('"release-v2": "Freigabe"'));
        expect(onLabelChange).toHaveBeenCalledWith(3, expect.stringContaining('"release-v2": "Release"'));
    });
});
