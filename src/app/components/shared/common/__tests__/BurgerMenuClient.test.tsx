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
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../IconComponent', () => ({
    default: () => null,
}));

function item(label: string, id: number, children: INavigationMenuItem[] = []): INavigationMenuItem {
    return {
        id,
        item_type: 'page',
        label,
        position: id,
        page: { id: 100 + id, keyword: label.toLowerCase(), url: `/${label.toLowerCase()}`, title: label },
        children,
    };
}

const headerMenu: INavigationMenu = {
    key: 'web_header',
    platform: 'web',
    surface: 'header',
    preset: 'dropdown',
    items: [
        item('About', 1, [item('Team', 2)]),
        item('Contact', 3),
    ],
};

describe('BurgerMenuClient', () => {
    beforeEach(() => {
        mockUseMediaQuery.mockReturnValue(true);
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
});
