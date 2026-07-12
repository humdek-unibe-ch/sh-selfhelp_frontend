/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import type { IAdminNavigationMenuItem } from '../../../../../api/admin/navigation.api';

const { createMenuItem } = vi.hoisted(() => ({
    createMenuItem: vi.fn(),
}));

vi.mock('../../../../../api/admin/navigation.api', () => ({
    AdminNavigationApi: {
        createMenuItem,
        updateMenuItem: vi.fn(),
    },
}));

vi.mock('../../../../../hooks/useAdminPages', () => ({
    useAdminPages: () => ({
        pages: [
            { id_pages: 10, keyword: 'home', url: '/home', id_parent_page: null },
            // Carries a localized title: the picker shows it before the keyword.
            {
                id_pages: 11,
                keyword: 'about',
                url: '/about',
                id_parent_page: null,
                titles: [{ language_id: 1, title: 'Über uns' }],
            },
            { id_pages: 12, keyword: 'contact', url: '/contact', id_parent_page: null },
        ],
        isLoading: false,
    }),
}));

vi.mock('../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({ currentLanguageId: 1 }),
}));

vi.mock('../../shared/field-components/SelectIconMobileField', () => ({
    SelectIconMobileField: () => null,
}));

vi.mock('../../../shared/common/SelectIconField', () => ({
    SelectIconField: () => null,
}));

import { AddMenuItemModal } from '../NavigationItemModals';

function menuItem(overrides: Partial<IAdminNavigationMenuItem> & { id: number }): IAdminNavigationMenuItem {
    return {
        parent_item_id: null,
        item_type: 'page',
        page_id: null,
        external_url: null,
        icon: null,
        mobile_icon: null,
        label: null,
        position: overrides.id,
        layer: null,
        is_active: true,
        ...overrides,
    };
}

describe('AddMenuItemModal page picker', () => {
    beforeEach(() => {
        createMenuItem.mockReset();
    });

    it('hides pages that are already in the current menu and explains why', () => {
        renderWithProviders(
            <AddMenuItemModal
                menuKey="web_header"
                parentItemId={null}
                parentItemLabel={null}
                menuItems={[
                    menuItem({ id: 1, page_id: 10 }),
                    menuItem({ id: 2, page_id: 12, parent_item_id: 1 }),
                ]}
                opened
                onClose={vi.fn()}
                onCreated={vi.fn()}
            />,
        );

        // Search with a string every keyword contains, so the dropdown shows
        // every AVAILABLE page: home (10) and contact (12) are already in this
        // menu — only about may remain. Options render two lines (localized
        // title or keyword + route), so accessible names include both.
        const picker = screen.getByRole('combobox', { name: 'Page' });
        fireEvent.focus(picker);
        fireEvent.change(picker, { target: { value: 'o' } });

        expect(screen.getByRole('option', { name: 'Über uns /about' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /home/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /contact/ })).not.toBeInTheDocument();
        expect(screen.getByText('2 page(s) already in this menu are not listed.')).toBeInTheDocument();
    });

    it('lists every page when the menu is empty', () => {
        renderWithProviders(
            <AddMenuItemModal
                menuKey="web_footer"
                parentItemId={null}
                parentItemLabel={null}
                menuItems={[]}
                opened
                onClose={vi.fn()}
                onCreated={vi.fn()}
            />,
        );

        const picker = screen.getByRole('combobox', { name: 'Page' });
        fireEvent.focus(picker);
        fireEvent.change(picker, { target: { value: 'o' } });

        expect(screen.getByRole('option', { name: 'home /home' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Über uns /about' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'contact /contact' })).toBeInTheDocument();
        expect(screen.queryByText(/already in this menu are not listed/)).not.toBeInTheDocument();
    });
});
