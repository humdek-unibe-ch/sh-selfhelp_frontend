/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { FormFieldValueContext } from '../FormStyle';
import FileInputStyle from '../mantine/inputs/FileInputStyle';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

type TFileInput = ComponentProps<typeof FileInputStyle>['style'];

const style = {
    id: 40,
    style_name: 'file-input',
    name: { content: 'portrait' },
    label: { content: 'Portrait' },
    is_required: { content: '0' },
} as unknown as TFileInput;

const existingPrefill = {
    files: [
        {
            index: 0,
            name: 'shot.png',
            mime: 'image/png',
            size: 12,
            url: '/lists/1/records/2/files/portrait?page_id=3&index=0',
        },
    ],
};

describe('FileInputStyle with a stored file (contract 4)', () => {
    it('shows the stored image and Remove clears it from the form', () => {
        renderWithProviders(
            <FormFieldValueContext.Provider
                value={{
                    getFieldValue: () => null,
                    getFileFieldValue: (name) => (name === 'portrait' ? existingPrefill : null),
                }}
            >
                <FileInputStyle style={style} styleProps={{}} cssClass="" />
            </FormFieldValueContext.Provider>,
        );

        expect(screen.getByTestId('file-input-existing')).toBeInTheDocument();
        expect(screen.getByText('shot.png')).toBeInTheDocument();
        expect(screen.getByText(/Pick a file to replace/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Remove shot.png' }));
        expect(screen.queryByTestId('file-input-existing')).not.toBeInTheDocument();
        expect(screen.queryByText('shot.png')).not.toBeInTheDocument();
    });
});
