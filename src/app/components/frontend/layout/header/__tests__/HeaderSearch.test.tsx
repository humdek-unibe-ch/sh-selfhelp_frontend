/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { API_CONFIG } from '../../../../../../config/api.config';
import { HeaderSearch } from '../HeaderSearch';

const mockGet = vi.fn();

const mockNavigationState = vi.hoisted(() => ({
    search: { mode: 'content_index' as string, min_chars: 3, result_limit: 8 },
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
    useRouter: () => ({ push: vi.fn() }),
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

describe('HeaderSearch', () => {
    beforeEach(() => {
        mockGet.mockReset();
        mockNavigationState.search = { mode: 'content_index', min_chars: 3, result_limit: 8 };
    });

    it('does not call the search API before min_chars is reached', async () => {
        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        const input = screen.getByPlaceholderText('Search');
        await user.type(input, 'ab');

        await waitFor(() => {
            expect(mockGet).not.toHaveBeenCalled();
        });
    });

    it('does not show result list before min_chars is reached', async () => {
        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        const input = screen.getByPlaceholderText('Search');
        await user.type(input, 'ab');

        await waitFor(() => {
            expect(mockGet).not.toHaveBeenCalled();
        });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('calls the search API once the query meets min_chars', async () => {
        mockGet.mockResolvedValue({ data: { results: [] } });
        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        const input = screen.getByPlaceholderText('Search');
        await user.type(input, 'abc');

        await waitFor(() => {
            expect(mockGet).toHaveBeenCalled();
        });
    });

    it('calls the searchable-pages endpoint when search mode is searchable_pages', async () => {
        mockNavigationState.search = { mode: 'searchable_pages', min_chars: 2, result_limit: 8 };
        mockGet.mockResolvedValue({ data: { results: [] } });
        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        const input = screen.getByPlaceholderText('Search');
        await user.type(input, 'ab');

        await waitFor(() => {
            expect(mockGet).toHaveBeenCalledWith(
                API_CONFIG.ENDPOINTS.SEARCH_PAGES,
                'ab',
                1,
            );
        });
    });
});
