/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { INavigationMenu } from '@selfhelp/shared';
import { WebsiteFooterLinks } from '../WebsiteFooterLinks';

/**
 * M2: the footer was rendered once on the server, so a client-side language
 * switch left it in the old language until a reload.
 */
const mockUseAppNavigation = vi.fn();

vi.mock('../../../../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => mockUseAppNavigation(),
}));

vi.mock('../FooterLinks', () => ({
    FooterLinks: ({ footerMenu }: { footerMenu: INavigationMenu | null }) => <div>{footerMenu?.preset}</div>,
}));

const menu = (preset: string) => ({ preset } as unknown as INavigationMenu);

describe('WebsiteFooterLinks', () => {
    it('shows the footer menu of the current language once it is loaded', () => {
        mockUseAppNavigation.mockReturnValue({ footerMenu: menu('english-menu') });
        render(<WebsiteFooterLinks initialFooterMenu={menu('german-ssr-menu')} />);
        expect(screen.getByText('english-menu')).toBeInTheDocument();
    });

    it('keeps the server-rendered menu until the client menu is available', () => {
        mockUseAppNavigation.mockReturnValue({ footerMenu: null });
        render(<WebsiteFooterLinks initialFooterMenu={menu('german-ssr-menu')} />);
        expect(screen.getByText('german-ssr-menu')).toBeInTheDocument();
    });
});
