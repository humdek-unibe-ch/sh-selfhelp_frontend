/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TFormListChange } from '../../../../../../shared';
import { FormListChanges } from '../FormListChanges';

const changes: TFormListChange[] = [
    {
        field_key: 'section_1',
        field_label: 'Portrait',
        language_id: 1,
        kind: 'file',
        change: 'changed',
        before: null,
        after: null,
        truncated: false,
        before_files: [{ index: 0, name: 'old.png', available: true, url: '/lists/1/records/2/versions/1/files/section_1?index=0' }],
        after_files: [{ index: 0, name: 'new.png', available: true, url: '/lists/1/records/2/versions/2/files/section_1?index=0' }],
    },
    {
        field_key: 'section_2',
        field_label: 'Report',
        language_id: 1,
        kind: 'file',
        change: 'added',
        before: null,
        after: null,
        truncated: false,
        before_files: [],
        after_files: [{ index: 0, name: 'notes.pdf', available: true, url: '/lists/1/records/2/versions/2/files/section_2?index=0' }],
    },
];

describe('FormListChanges file history (P3-A3)', () => {
    it('shows a thumbnail for an image change and a download link for a non-image file', () => {
        render(
            <MantineProvider>
                <FormListChanges
                    changes={changes}
                    fileHref={(_change, file) => file.url ?? '#'}
                />
            </MantineProvider>,
        );

        const thumbs = screen.getAllByTestId('form-list-history-thumb');
        expect(thumbs.length).toBe(2);
        expect(thumbs[0]).toHaveAttribute('src', expect.stringContaining('/versions/1/files/'));
        expect(thumbs[1]).toHaveAttribute('src', expect.stringContaining('/versions/2/files/'));
        expect(screen.getByRole('link', { name: 'notes.pdf' })).toHaveAttribute(
            'href',
            expect.stringContaining('/files/section_2'),
        );
    });
});
