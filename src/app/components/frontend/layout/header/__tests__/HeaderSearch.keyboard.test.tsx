/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * L11: the header search fired one request per keystroke and ignored the
 * arrow keys. Typing must be debounced and results keyboard-navigable.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { HeaderSearch } from '../HeaderSearch';

const mockGet = vi.fn();
const mockPush = vi.hoisted(() => vi.fn());

const mockNavigationState = vi.hoisted(() => ({
    search: { mode: 'content_index' as string, min_chars: 2, result_limit: 8 },
    menus: {},
    startup: {
        web_guest_start_page: null,
        web_user_start_page: null,
        web_user_start_mode: 'fixed_page',
        mobile_guest_start_page: null,
        mobile_user_start_page: null,
        mobile_user_start_mode: 'fixed_page',
        mobile_start_page_source: 'same_as_web',
    },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

vi.mock('../../../../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => ({
        navigation: {
            search: mockNavigationState.search,
            menus: mockNavigationState.menus,
            startup: mockNavigationState.startup,
        },
    }),
}));

vi.mock('../../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({ currentLanguageId: 1 }),
}));

vi.mock('@mantine/hooks', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as Record<string, unknown>),
        useMediaQuery: () => false,
    };
});

vi.mock('../../../../../../api/base.api', () => ({
    permissionAwareApiClient: {
        get: (...args: unknown[]) => mockGet(...args),
    },
}));

/** An Axios response carrying the real Symfony success envelope. */
function envelopeResponse(results: unknown[]) {
    return {
        data: {
            status: 200,
            message: 'OK',
            error: null,
            logged_in: true,
            meta: {},
            data: { results },
        },
    };
}

describe('HeaderSearch typing and keyboard', () => {
    beforeEach(() => {
        mockGet.mockReset();
        mockPush.mockReset();
    });

    it('sends one request for a quickly typed term instead of one per keystroke', async () => {
        mockGet.mockResolvedValue(envelopeResponse([]));

        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        await user.type(screen.getByPlaceholderText('Search'), 'about');

        await waitFor(() => expect(mockGet).toHaveBeenCalled());
        expect(mockGet.mock.calls.map((call) => call[1])).toEqual(['about']);
    });

    it('moves through results with the arrow keys and opens one with Enter', async () => {
        mockGet.mockResolvedValue(
            envelopeResponse([
                { page_id: 7, keyword: 'about-us', url: '/about-us', title: 'About us' },
                { page_id: 8, keyword: 'about-team', url: '/about-team', title: 'About the team' },
            ]),
        );

        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        const input = screen.getByPlaceholderText('Search');
        await user.type(input, 'abo');
        const options = await screen.findAllByRole('option');

        await user.keyboard('{ArrowDown}');
        expect(options[0]).toHaveAttribute('aria-selected', 'true');
        await user.keyboard('{ArrowDown}');
        expect(options[1]).toHaveAttribute('aria-selected', 'true');
        expect(input).toHaveAttribute('aria-activedescendant', options[1].id);

        await user.keyboard('{Enter}');
        expect(mockPush).toHaveBeenCalledWith('/about-team');
    });
});
