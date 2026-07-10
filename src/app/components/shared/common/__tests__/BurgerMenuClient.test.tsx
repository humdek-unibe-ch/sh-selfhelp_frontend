/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type INavigationMenu, type INavigationMenuItem } from '@selfhelp/shared';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { BurgerMenuClient } from '../BurgerMenuClient';

const mockUseMediaQuery = vi.fn();
const mockRouterPush = vi.fn();

vi.mock('@mantine/hooks', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as Record<string, unknown>),
        useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
    };
});

vi.mock('../../../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => ({ headerMenu: null }),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/about',
    useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('../IconComponent', () => ({
    default: () => null,
}));

function item(
    label: string,
    id: number,
    children: INavigationMenuItem[] = [],
    layer: 'top' | null = null,
): INavigationMenuItem {
    return {
        id,
        item_type: 'page',
        label,
        description: null,
        aria_label: null,
        icon: null,
        mobile_icon: null,
        position: id,
        layer,
        external_url: null,
        page: { id: 100 + id, keyword: label.toLowerCase(), url: `/${label.toLowerCase()}`, title: label },
        is_active: true,
        children_nav: null,
        children,
    };
}

const headerMenu: INavigationMenu = {
    key: 'web_header',
    platform: 'web',
    surface: 'header',
    preset: 'dropdown',
    max_depth: null,
    item_limit: null,
    children_nav: 'sidebar',
    show_breadcrumbs: false,
    items: [
        item('About', 1, [item('Team', 2)]),
        item('Contact', 3),
        item('Support', 4, [], 'top'),
    ],
};

describe('BurgerMenuClient', () => {
    beforeEach(() => {
        mockUseMediaQuery.mockReturnValue(true);
        mockRouterPush.mockReset();
    });

    it('renders nothing on large viewports', () => {
        mockUseMediaQuery.mockReturnValue(false);
        renderWithProviders(<BurgerMenuClient initialHeaderMenu={headerMenu} />);
        expect(screen.queryByLabelText('Open navigation menu')).not.toBeInTheDocument();
    });

    it('opens drawer with web_header tree on small viewports', async () => {
        const user = userEvent.setup();
        renderWithProviders(<BurgerMenuClient initialHeaderMenu={headerMenu} />);

        await user.click(screen.getByLabelText('Open navigation menu'));

        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument();
        });
        expect(screen.getByText('About')).toBeInTheDocument();
        expect(screen.getByText('Team')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('lists top-layer links after the main tree in the drawer', async () => {
        const user = userEvent.setup();
        renderWithProviders(<BurgerMenuClient initialHeaderMenu={headerMenu} />);

        await user.click(screen.getByLabelText('Open navigation menu'));

        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument();
        });
        const labels = screen.getAllByText(/About|Contact|Support/).map((node) => node.textContent);
        expect(labels.indexOf('Support')).toBeGreaterThan(labels.indexOf('Contact'));
    });

    it('expands a parent item without navigating when it has children', async () => {
        const user = userEvent.setup();
        const productsMenu: INavigationMenu = {
            ...headerMenu,
            items: [item('Products', 10, [item('Product A', 11), item('Product B', 12)])],
        };
        renderWithProviders(<BurgerMenuClient initialHeaderMenu={productsMenu} />);

        await user.click(screen.getByLabelText('Open navigation menu'));
        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument();
        });
        await user.click(screen.getByText('Products'));

        expect(mockRouterPush).not.toHaveBeenCalled();
        await user.click(screen.getByText('Product A'));
        expect(mockRouterPush).toHaveBeenCalledWith('/product a');
    });

    it('navigates when a leaf item is selected', async () => {
        const user = userEvent.setup();
        renderWithProviders(<BurgerMenuClient initialHeaderMenu={headerMenu} />);

        await user.click(screen.getByLabelText('Open navigation menu'));
        await waitFor(() => {
            expect(screen.getByText('Contact')).toBeInTheDocument();
        });
        await user.click(screen.getByText('Contact'));

        expect(mockRouterPush).toHaveBeenCalledWith('/contact');
    });
});
