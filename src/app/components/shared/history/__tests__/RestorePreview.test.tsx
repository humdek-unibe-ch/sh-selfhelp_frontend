/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { RestoreBlockers, RestoreChanges } from '../RestorePreview';
import { restorableFieldKeys } from '../restore-preview';

describe('restore preview (form list and data browser)', () => {
    it('shows what each field holds now and after the restore', () => {
        renderWithProviders(
            <RestoreChanges
                data-testid="changes"
                changes={[
                    { field_key: 'title', field_label: 'Title', language_id: 1, action: 'set', kind: 'value', before: 'now', after: 'then' },
                    { field_key: 'note', field_label: null, language_id: 2, action: 'remove', kind: 'value', before: 'x', after: null },
                    {
                        field_key: 'cv',
                        field_label: 'CV',
                        language_id: 1,
                        action: 'set',
                        kind: 'file',
                        before: null,
                        after: null,
                        before_files: [],
                        after_files: [{ index: 0, name: 'old.pdf', available: false }],
                    },
                ]}
            />,
        );
        const list = screen.getByTestId('changes');
        expect(list).toHaveTextContent('TitleSet');
        expect(list).toHaveTextContent('Before: now');
        expect(list).toHaveTextContent('After: then');
        expect(list).toHaveTextContent('noteRemovelanguage 2');
        expect(list).toHaveTextContent('After: empty');
        expect(list).toHaveTextContent('old.pdf (file no longer available)');
    });

    it('names each blocked field with its reason', () => {
        renderWithProviders(
            <RestoreBlockers
                data-testid="blockers"
                blockers={[{ field_key: 'note', field_label: 'Note', language_id: 1, reason: 'invalid_value', detail: null }]}
            />,
        );
        expect(screen.getByTestId('blockers')).toHaveTextContent('Some fields cannot be restored');
        expect(screen.getByTestId('blockers')).toHaveTextContent('Note: the value is no longer valid');
    });

    it('keeps only the fields no blocker refuses, per language', () => {
        const change = { field_label: null, action: 'set' as const, kind: 'value' as const, before: null, after: 'a' };
        expect(restorableFieldKeys(
            [
                { ...change, field_key: 'title', language_id: 1 },
                { ...change, field_key: 'title', language_id: 2 },
                { ...change, field_key: 'note', language_id: 1 },
            ],
            [{ field_key: 'note', field_label: null, language_id: 1, reason: 'field_missing', detail: null }],
        )).toEqual(['title']);
    });
});
