/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import type { IAdminNavigationMenuDefinition, IAdminNavigationOverview } from '../../../../../api/admin/navigation.api';

const { getOverview, getMenuPreview, updateMenuDefinition } = vi.hoisted(() => ({
    getOverview: vi.fn(),
    getMenuPreview: vi.fn(),
    updateMenuDefinition: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => '/admin/menus',
    useSearchParams: () => ({
        get: (name: string) => (name === 'menu' ? 'web_header' : null),
    }),
}));

vi.mock('../../../../../api/admin/navigation.api', () => ({
    AdminNavigationApi: {
        getOverview,
        getMenuPreview,
        updateMenuDefinition,
        deleteMenuItem: vi.fn(),
        reorderMenuItems: vi.fn(),
        updateSettings: vi.fn(),
    },
}));

vi.mock('../../../../../hooks/usePermissionChecks', () => ({
    useCanUpdateNavigation: () => true,
    useCanExportNavigation: () => false,
    useCanImportNavigation: () => false,
}));

vi.mock('../../../../../hooks/useAdminPages', () => ({
    useAdminPages: () => ({ pages: [], isLoading: false }),
}));

vi.mock('../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({ currentLanguageId: 1 }),
}));

vi.mock('../NavigationMenuItemsList', () => ({
    NavigationMenuItemsList: () => <div data-testid="menu-items-list" />,
}));

vi.mock('../NavigationStructuralPreview', () => ({
    NavigationStructuralPreview: () => <div data-testid="structural-preview" />,
}));

vi.mock('../NavigationItemModals', () => ({
    AddMenuItemModal: () => null,
    EditMenuItemModal: () => null,
}));

vi.mock('../../pages/create-page/CreatePage', () => ({
    CreatePageModal: () => null,
}));

vi.mock('../../../../../utils/admin-navigation-cache.utils', () => ({
    patchNavigationOverview: vi.fn(),
    schedulePublicNavigationRefresh: vi.fn(),
}));

import { NavigationBuilderPage } from '../NavigationBuilderPage';

function menuDef(
    key: string,
    overrides: Partial<IAdminNavigationMenuDefinition> = {},
): IAdminNavigationMenuDefinition {
    const platform = key.startsWith('mobile_') ? 'mobile' : 'web';
    return {
        key,
        platform,
        surface: key,
        is_system: true,
        preset: key === 'web_header' ? 'double_solid' : key === 'web_footer' ? 'columns' : null,
        max_depth: null,
        item_limit: key === 'web_header' ? 8 : key === 'mobile_bottom_tabs' ? 5 : null,
        children_nav: key === 'web_header' ? 'sidebar' : null,
        show_breadcrumbs: false,
        show_pager: true,
        items: [
            {
                id: 1,
                parent_item_id: null,
                item_type: 'page',
                page_id: 10,
                external_url: null,
                icon: null,
                mobile_icon: null,
                label: 'Home',
                position: 1,
                layer: null,
                is_active: true,
            },
            {
                id: 2,
                parent_item_id: null,
                item_type: 'page',
                page_id: 11,
                external_url: null,
                icon: null,
                mobile_icon: null,
                label: 'About',
                position: 2,
                layer: null,
                is_active: true,
            },
        ],
        ...overrides,
    };
}

function overview(headerLimit: number | null = 8): IAdminNavigationOverview {
    return {
        menus: {
            web_header: menuDef('web_header', { item_limit: headerLimit }),
            web_footer: menuDef('web_footer'),
            mobile_drawer: menuDef('mobile_drawer'),
            mobile_bottom_tabs: menuDef('mobile_bottom_tabs'),
        },
        settings: {},
    };
}

describe('NavigationBuilderPage Max root items', () => {
    beforeEach(() => {
        getOverview.mockReset();
        getMenuPreview.mockReset();
        updateMenuDefinition.mockReset();
        getOverview.mockResolvedValue(overview(8));
        getMenuPreview.mockResolvedValue({
            menu_key: 'web_header',
            resolved: { items: [] },
            warnings: [],
            suggestions: [],
        });
        updateMenuDefinition.mockImplementation(async (_key: string, payload: { item_limit?: number | null }) => ({
            ...menuDef('web_header', { item_limit: payload.item_limit ?? null }),
        }));
    });

    it('saves Max root items via updateMenuDefinition and shows the badge', async () => {
        renderWithProviders(<NavigationBuilderPage />);

        const input = await screen.findByLabelText('Max root items');
        expect(screen.getByText('2 / 8 root items')).toBeInTheDocument();
        expect(screen.getByText(/Recommended: 8/)).toBeInTheDocument();

        fireEvent.change(input, { target: { value: '12' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(updateMenuDefinition).toHaveBeenCalledWith('web_header', { item_limit: 12 });
        });
    });

    it('clears Max root items to null (unlimited)', async () => {
        renderWithProviders(<NavigationBuilderPage />);

        const input = await screen.findByLabelText('Max root items');
        fireEvent.change(input, { target: { value: '' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(updateMenuDefinition).toHaveBeenCalledWith('web_header', { item_limit: null });
        });
    });
});
