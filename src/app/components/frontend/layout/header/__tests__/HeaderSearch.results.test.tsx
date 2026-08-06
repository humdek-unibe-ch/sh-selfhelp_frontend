/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression: the header search must render the hits the backend returns.
 *
 * The backend wraps payloads in the Symfony envelope
 * (`ApiResponseFormatter::formatSuccess(['results' => ...])`), so an Axios
 * response carries them at `response.data.data.results`. These tests use that
 * real shape rather than the flattened `{ data: { results } }` the older specs
 * mock, which is what let a mismatch here go unnoticed.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { HeaderSearch } from '../HeaderSearch';

const mockGet = vi.fn();

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

describe('HeaderSearch results rendering', () => {
    beforeEach(() => {
        mockGet.mockReset();
        mockNavigationState.search = { mode: 'content_index', min_chars: 2, result_limit: 8 };
    });

    it('renders hits returned in the Symfony response envelope', async () => {
        mockGet.mockResolvedValue(
            envelopeResponse([
                { page_id: 7, keyword: 'about-us', url: '/about-us', title: 'About us' },
            ]),
        );

        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        await user.type(screen.getByPlaceholderText('Search'), 'abo');

        await waitFor(() => {
            expect(mockGet).toHaveBeenCalled();
        });

        // `Highlight` splits the label around the match, so assert on the
        // row's text content rather than a single text node.
        const option = await screen.findByRole('option');
        expect(option).toHaveTextContent('About us');
        expect(option).toHaveTextContent('/about-us');
    });

    it('stops showing the loading spinner once the request settles', async () => {
        mockGet.mockResolvedValue(envelopeResponse([]));

        const user = userEvent.setup();
        const { container } = renderWithProviders(<HeaderSearch />);

        await user.type(screen.getByPlaceholderText('Search'), 'abo');

        await waitFor(() => {
            expect(mockGet).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(container.querySelector('.mantine-Loader-root')).toBeNull();
        });
    });

    // The panel below mirrors the admin `NavigationSearch` UX.
    it('shows the Results header with a match count, like the CMS panel', async () => {
        mockGet.mockResolvedValue(
            envelopeResponse([
                { page_id: 7, keyword: 'about-us', url: '/about-us', title: 'About us' },
                { page_id: 8, keyword: 'about-team', url: '/about-team', title: 'About the team' },
            ]),
        );

        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        await user.type(screen.getByPlaceholderText('Search'), 'abo');

        const panel = await screen.findByRole('listbox', { name: 'Search results' });
        expect(await within(panel).findByText('Results')).toBeInTheDocument();
        expect(within(panel).getByText('2')).toBeInTheDocument();
        expect(within(panel).getAllByRole('option')).toHaveLength(2);
    });

    it('shows the CMS-style empty state when nothing matches', async () => {
        mockGet.mockResolvedValue(envelopeResponse([]));

        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        await user.type(screen.getByPlaceholderText('Search'), 'zzz');

        expect(await screen.findByText('No results')).toBeInTheDocument();
        expect(screen.getByText(/Nothing matches "zzz"/)).toBeInTheDocument();
    });

    it('keeps the panel closed until min_chars is reached', async () => {
        mockNavigationState.search = { mode: 'content_index', min_chars: 3, result_limit: 8 };
        mockGet.mockResolvedValue(envelopeResponse([]));

        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        await user.type(screen.getByPlaceholderText('Search'), 'ab');

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(screen.queryByText('No results')).not.toBeInTheDocument();
    });

    it('clears the query from the clear button', async () => {
        mockGet.mockResolvedValue(envelopeResponse([]));

        const user = userEvent.setup();
        renderWithProviders(<HeaderSearch />);

        const input = screen.getByPlaceholderText('Search');
        await user.type(input, 'abo');
        await waitFor(() => expect(mockGet).toHaveBeenCalled());

        await user.click(await screen.findByRole('button', { name: 'Clear search' }));

        expect(input).toHaveValue('');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});
