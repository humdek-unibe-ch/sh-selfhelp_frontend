/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

/**
 * L6: "Add to menu → <menu>" only opened the menu builder; it must add the
 * page to that menu and confirm it.
 */
const { createMenuItem, showNotification } = vi.hoisted(() => ({
    createMenuItem: vi.fn(),
    showNotification: vi.fn(),
}));

vi.mock('../../../../../../api/admin/navigation.api', () => ({
    AdminNavigationApi: { createMenuItem, deleteMenuItem: vi.fn() },
}));
vi.mock('@mantine/notifications', () => ({ notifications: { show: showNotification } }));
vi.mock('../../../../../../hooks/usePermissionChecks', () => ({ useCanUpdateNavigation: () => true }));
vi.mock('../../../../../../hooks/useAdminPages', () => ({
    useAdminPages: () => ({
        pages: [{ id_pages: 5, keyword: 'about', navigationMembership: [{ menu_key: 'web_header', explicit: true, menu_item_id: 1 }] }],
        isLoading: false,
    }),
}));

import { PageNavigationMembership } from '../page-field-groups';

describe('PageNavigationMembership "Add to menu"', () => {
    it('adds the page to the chosen menu and confirms it', async () => {
        createMenuItem.mockResolvedValue({ item: { id: 2 }, children: [] });
        renderWithProviders(<PageNavigationMembership pageId={5} />);

        await userEvent.click(screen.getByRole('button', { name: 'Add to menu' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Web footer' }, { timeout: 5000 }));

        await waitFor(() =>
            expect(createMenuItem).toHaveBeenCalledWith('web_footer', { item_type: 'page', page_id: 5, parent_item_id: null }),
        { timeout: 5000 });
        await waitFor(() => expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ color: 'green' })));
    });

    it('disables menus the page is already in', async () => {
        renderWithProviders(<PageNavigationMembership pageId={5} />);

        await userEvent.click(screen.getByRole('button', { name: 'Add to menu' }));

        expect(await screen.findByRole('menuitem', { name: /Web header/ }, { timeout: 5000 })).toBeDisabled();
    });
});
