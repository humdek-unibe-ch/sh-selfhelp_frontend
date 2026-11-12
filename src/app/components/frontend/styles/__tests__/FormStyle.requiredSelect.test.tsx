/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * M4: saving a CMS record with the required "Kategorie" select empty reported
 * "required fields: Select an option" (the placeholder), not the field label.
 */
const { submitFormMock } = vi.hoisted(() => ({ submitFormMock: vi.fn() }));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));
vi.mock('../../../../../hooks/usePageContentValue', () => ({
    usePageContentValue: () => ({ id: 1 }),
}));
vi.mock('../../../../../api/frontend/form-submission.api', () => ({
    FormSubmissionApi: { submitForm: submitFormMock, updateForm: vi.fn() },
}));

import FormStyle from '../FormStyle';

type TFormStyle = ComponentProps<typeof FormStyle>['style'];

const formStyle = {
    id: 20,
    style_name: 'form-record',
    btn_save_label: { content: 'Speichern' },
    children: [
        {
            id: 21,
            style_name: 'select',
            name: { content: 'category' },
            label: { content: 'Kategorie' },
            options: { content: '[{"value":"account"},{"value":"privacy"}]' },
            is_required: { content: '1' },
        },
    ],
} as unknown as TFormStyle;

describe('FormStyle with a required select', () => {
    it('blocks submit and names the empty select by its label', async () => {
        renderWithProviders(<FormStyle style={formStyle} styleProps={{}} cssClass="" />);

        fireEvent.submit(document.querySelector('form') as HTMLFormElement);

        expect(await screen.findByText(/required fields: Kategorie/)).toBeInTheDocument();
        expect(submitFormMock).not.toHaveBeenCalled();
    });
});
