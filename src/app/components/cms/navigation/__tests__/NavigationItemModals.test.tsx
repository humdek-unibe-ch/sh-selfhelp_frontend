/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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

vi.mock('../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({
        languages: [
            { id: 1, locale: 'de', language: 'German' },
            { id: 2, locale: 'en', language: 'English' },
        ],
        isLoading: false,
    }),
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

describe('AddMenuItemModal required fields', () => {
    beforeEach(() => {
        createMenuItem.mockReset();
    });

    function renderFooterAdd() {
        return renderWithProviders(
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
    }

    const addButton = () => screen.getByRole('button', { name: 'Add' });

    function selectItemType(label: string) {
        const typePicker = screen.getByRole('combobox', { name: 'Item type' });
        fireEvent.click(typePicker);
        fireEvent.click(screen.getByRole('option', { name: label }));
    }

    it('blocks Add for a group heading until a label is entered', async () => {
        renderFooterAdd();
        selectItemType('Group heading');

        expect(addButton()).toBeDisabled();
        // Clicking while disabled must not reach the API.
        fireEvent.click(addButton());
        expect(createMenuItem).not.toHaveBeenCalled();

        fireEvent.change(screen.getByRole('textbox', { name: /Label/ }), {
            target: { value: 'Legal' },
        });

        expect(addButton()).toBeEnabled();
        fireEvent.click(addButton());
        await waitFor(() => expect(createMenuItem).toHaveBeenCalledTimes(1));
    });

    it('blocks Add for an external URL until both URL and label are entered', () => {
        renderFooterAdd();
        selectItemType('External URL');

        expect(addButton()).toBeDisabled();

        fireEvent.change(screen.getByRole('textbox', { name: /URL/ }), {
            target: { value: 'https://example.org' },
        });
        // Label is still empty, so the URL alone must not unlock Add.
        expect(addButton()).toBeDisabled();

        fireEvent.change(screen.getByRole('textbox', { name: /Label/ }), {
            target: { value: 'Example' },
        });
        expect(addButton()).toBeEnabled();
    });

    it('blocks Add for a page item until a page is picked', () => {
        renderFooterAdd();

        expect(addButton()).toBeDisabled();

        const picker = screen.getByRole('combobox', { name: /Page/ });
        fireEvent.focus(picker);
        fireEvent.change(picker, { target: { value: 'home' } });
        fireEvent.click(screen.getByRole('option', { name: 'home /home' }));

        expect(addButton()).toBeEnabled();
    });

    it.each([
        ['Group heading'],
        ['External URL'],
    ])('keeps Add disabled whenever the required-label message is shown (%s)', (typeLabel) => {
        renderFooterAdd();
        selectItemType(typeLabel);

        // The message and the disabled button are two views of one rule: if the
        // message is on screen, saving must be blocked.
        expect(
            screen.getByText(/A label is required in at least one language/),
        ).toBeInTheDocument();
        expect(addButton()).toBeDisabled();

        fireEvent.change(screen.getByRole('textbox', { name: /Label/ }), {
            target: { value: 'Legal' },
        });

        expect(
            screen.queryByText(/A label is required in at least one language/),
        ).not.toBeInTheDocument();
    });

    it('accepts a label in one language only and warns about the rest', () => {
        renderFooterAdd();
        selectItemType('Group heading');

        fireEvent.change(screen.getByRole('textbox', { name: /Label/ }), {
            target: { value: 'Legal' },
        });

        expect(addButton()).toBeEnabled();
        expect(screen.getByText(/1 language still need a label/)).toBeInTheDocument();
    });
});
