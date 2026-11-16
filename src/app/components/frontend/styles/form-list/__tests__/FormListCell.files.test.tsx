/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { FormListCell } from '../FormListCell';

describe('FormListCell file / image formats (contract 2)', () => {
    it('draws an image thumbnail from the server url only', () => {
        renderWithProviders(
            <FormListCell
                column={{ field: 'portrait', label: 'Portrait', format: 'image', sortable: false, searchable: false }}
                value={{
                    files: [
                        {
                            index: 0,
                            name: 'shot.png',
                            mime: 'image/png',
                            size: 10,
                            url: '/lists/12/records/34/files/portrait?page_id=5&index=0',
                        },
                    ],
                }}
            />,
        );
        const img = screen.getByRole('img', { name: 'shot.png' });
        expect(img.getAttribute('src')).toContain('/lists/12/records/34/files/portrait');
        expect(img.getAttribute('src')).not.toContain('uploads/form-files');
    });

    it('draws download links for file format from the server url only', () => {
        renderWithProviders(
            <FormListCell
                column={{ field: 'doc', label: 'Doc', format: 'file', sortable: false, searchable: false }}
                value={{
                    files: [
                        {
                            index: 0,
                            name: 'report.pdf',
                            mime: 'application/pdf',
                            size: 99,
                            url: '/lists/12/records/34/files/doc?page_id=5&index=0',
                        },
                    ],
                }}
            />,
        );
        const link = screen.getByRole('link', { name: 'report.pdf' });
        expect(link.getAttribute('href')).toContain('/lists/12/records/34/files/doc');
        expect(link.getAttribute('href')).not.toContain('uploads/form-files');
    });
});
