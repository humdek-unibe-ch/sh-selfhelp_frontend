/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

const { completeValidationMock, tokenValidationState } = vi.hoisted(() => ({
    completeValidationMock: vi.fn(),
    tokenValidationState: {
        value: {
            data: { data: { token_valid: true, name: 'Ada' } } as unknown,
            isLoading: false,
            error: null as unknown,
        },
    },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('../../../../../hooks/usePageContentValue', () => ({
    usePageContentValue: () => ({ id: 1, route_params: { user_id: '9', token: 'tok' } }),
}));
vi.mock('../../../../../hooks/mutations/useValidationMutations', () => ({
    useValidateTokenMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCompleteValidationMutation: () => ({ mutateAsync: completeValidationMock, isPending: false }),
    useTokenValidation: () => tokenValidationState.value,
}));

import ValidateStyle from '../ValidateStyle';

type TValidateStyle = ComponentProps<typeof ValidateStyle>['style'];

const style = {
    id: 40,
    style_name: 'validate',
    children: [],
} as unknown as TValidateStyle;

describe('ValidateStyle public API error text', () => {
    beforeEach(() => {
        completeValidationMock.mockReset();
        tokenValidationState.value = {
            data: { data: { token_valid: true, name: 'Ada' } },
            isLoading: false,
            error: null,
        };
    });

    it('never shows the HTTP reason phrase from data.message', async () => {
        completeValidationMock.mockRejectedValueOnce({
            response: { status: 400, data: { error: null, message: 'Bad Request' } },
        });

        renderWithProviders(<ValidateStyle style={style} styleProps={{}} cssClass="" />);

        const passwordInputs = document.querySelectorAll('input[type="password"]');
        expect(passwordInputs.length).toBe(2);
        fireEvent.change(passwordInputs[0], { target: { value: 'Secret1!' } });
        fireEvent.change(passwordInputs[1], { target: { value: 'Secret1!' } });
        fireEvent.click(screen.getByRole('button', { name: /activate/i }));

        await waitFor(() => {
            expect(screen.getByText(/Failed to complete validation/i)).toBeInTheDocument();
        });
        expect(screen.queryByText('Bad Request')).not.toBeInTheDocument();
        expect(completeValidationMock).toHaveBeenCalled();
    });
});
