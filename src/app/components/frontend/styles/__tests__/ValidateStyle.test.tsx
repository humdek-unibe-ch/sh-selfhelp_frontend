/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * The activation page is the last step of the registration lifecycle. Its
 * loading/invalid-link status text used to be hardcoded English; these tests
 * pin that the CMS-managed labels (loading_title/text, error_title/heading/text)
 * are rendered so admins can localise the activation experience.
 *
 * The token-validation hooks are mocked so each test renders a specific
 * lifecycle state (validating / invalid link) without a backend.
 */
const { tokenValidationState } = vi.hoisted(() => ({
    tokenValidationState: {
        value: { data: undefined as unknown, isLoading: false, error: null as unknown },
    },
}));

vi.mock('next/navigation', () => ({
    useParams: () => ({ slug: ['validate', '1', 'tok'] }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('../../../../../hooks/usePageContentValue', () => ({
    usePageContentValue: () => ({ id: 1 }),
}));
vi.mock('../../../../../hooks/useFormSubmission', () => ({
    useSubmitFormMutation: () => ({ mutateAsync: vi.fn() }),
    useUpdateFormMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../../../../../hooks/mutations/useValidationMutations', () => ({
    useTokenValidation: () => tokenValidationState.value,
    useValidateTokenMutation: () => ({ mutateAsync: vi.fn() }),
    useCompleteValidationMutation: () => ({ mutateAsync: vi.fn() }),
}));

import ValidateStyle from '../ValidateStyle';

type ValidateStyleField = ComponentProps<typeof ValidateStyle>['style'];

function makeStyle(overrides: Record<string, unknown> = {}): ValidateStyleField {
    return { id: 1, style_name: 'validate', ...overrides } as unknown as ValidateStyleField;
}

describe('ValidateStyle', () => {
    it('renders the CMS-provided loading labels while the activation token is validated', () => {
        tokenValidationState.value = { data: undefined, isLoading: true, error: null };

        renderWithProviders(
            <ValidateStyle
                style={makeStyle({
                    loading_title: { content: 'Aktivierung läuft' },
                    loading_text: { content: 'Bitte warten Sie einen Moment.' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );

        expect(screen.getByText('Aktivierung läuft')).toBeInTheDocument();
        expect(screen.getByText('Bitte warten Sie einen Moment.')).toBeInTheDocument();
    });

    it('renders the CMS-provided invalid-link labels when the activation token is invalid', () => {
        tokenValidationState.value = {
            data: { data: { token_valid: false } },
            isLoading: false,
            error: null,
        };

        renderWithProviders(
            <ValidateStyle
                style={makeStyle({
                    error_title: { content: 'Ungültiger Link' },
                    error_heading: { content: 'Aktivierung fehlgeschlagen' },
                    error_text: { content: 'Dieser Link ist abgelaufen.' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );

        expect(screen.getByText('Ungültiger Link')).toBeInTheDocument();
        expect(screen.getByText('Aktivierung fehlgeschlagen')).toBeInTheDocument();
        expect(screen.getByText('Dieser Link ist abgelaufen.')).toBeInTheDocument();
    });
});
