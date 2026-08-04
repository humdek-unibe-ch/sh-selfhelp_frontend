/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import type { IAdminNavigationMenuItem } from '../../../../../api/admin/navigation.api';
import type { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { NavigationStructuralPreview } from '../NavigationStructuralPreview';

function item(overrides: Partial<IAdminNavigationMenuItem> & { id: number }): IAdminNavigationMenuItem {
    return {
        parent_item_id: null,
        item_type: 'page',
        page_id: null,
        external_url: null,
        icon: null,
        mobile_icon: null,
        label: null,
        position: overrides.id * 10,
        layer: null,
        is_active: true,
        ...overrides,
    };
}

const noPages = new Map<number, IAdminPage>();
const labels = (entries: Array<[number, string]>) => new Map<number, string>(entries);

describe('NavigationStructuralPreview', () => {
    it('splits the web header into top and main rows in layer mode', () => {
        renderWithProviders(
            <NavigationStructuralPreview
                menuKey="web_header"
                layerMode
                items={[
                    item({ id: 1, label: 'Login', layer: 'top' }),
                    item({ id: 2, label: 'Products' }),
                    item({ id: 3, label: 'Docs', parent_item_id: 2 }),
                ]}
                pageById={noPages}
                resolvedLabelByItemId={labels([[1, 'Login'], [2, 'Products'], [3, 'Docs']])}
            />,
        );

        expect(screen.getByText('Top row')).toBeInTheDocument();
        expect(screen.getByText('Main row')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
        // Products has one dropdown child, marked with the child counter.
        expect(screen.getByText('Products ▾1')).toBeInTheDocument();
    });

    it('merges everything into one row when the header preset is single-layer', () => {
        renderWithProviders(
            <NavigationStructuralPreview
                menuKey="web_header"
                layerMode={false}
                items={[
                    item({ id: 1, label: 'Login', layer: 'top' }),
                    item({ id: 2, label: 'Products' }),
                ]}
                pageById={noPages}
                resolvedLabelByItemId={labels([[1, 'Login'], [2, 'Products']])}
            />,
        );

        expect(screen.getByText('One row')).toBeInTheDocument();
        expect(screen.queryByText('Top row')).not.toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('renders footer group columns plus a meta row for standalone links', () => {
        renderWithProviders(
            <NavigationStructuralPreview
                menuKey="web_footer"
                footerPreset="columns"
                items={[
                    item({ id: 1, item_type: 'group', label: 'Support' }),
                    item({ id: 2, label: 'Contact', parent_item_id: 1 }),
                    item({ id: 3, item_type: 'external_url', label: 'Status', external_url: 'https://status.example.org' }),
                ]}
                pageById={noPages}
                resolvedLabelByItemId={labels([[1, 'Support'], [2, 'Contact'], [3, 'Status']])}
            />,
        );

        expect(screen.getByText('Support')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('Meta row')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('flattens footer groups for the inline preset and hides headings', () => {
        renderWithProviders(
            <NavigationStructuralPreview
                menuKey="web_footer"
                footerPreset="inline"
                items={[
                    item({ id: 1, item_type: 'group', label: 'Support' }),
                    item({ id: 2, label: 'Contact', parent_item_id: 1 }),
                ]}
                pageById={noPages}
                resolvedLabelByItemId={labels([[1, 'Support'], [2, 'Contact']])}
            />,
        );

        expect(screen.queryByText('Support')).not.toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('marks bottom-tab holder groups and mutes items over the tab limit', () => {
        renderWithProviders(
            <NavigationStructuralPreview
                menuKey="mobile_bottom_tabs"
                itemLimit={2}
                items={[
                    item({ id: 1, label: 'Home' }),
                    item({ id: 2, item_type: 'group', label: 'More' }),
                    item({ id: 3, label: 'FAQ', parent_item_id: 2 }),
                    item({ id: 4, label: 'Hidden tab' }),
                ]}
                pageById={noPages}
                resolvedLabelByItemId={labels([[1, 'Home'], [2, 'More'], [3, 'FAQ'], [4, 'Hidden tab']])}
            />,
        );

        expect(screen.getByText('Home')).toBeInTheDocument();
        // Group holder tab shows which child it opens.
        expect(screen.getByText('More → FAQ')).toBeInTheDocument();
        // The item over the limit is still listed (muted) so admins see it exists.
        expect(screen.getByText('Hidden tab')).toBeInTheDocument();
    });

    it('previews bottom-tab children as the top tab strip they become', () => {
        renderWithProviders(
            <NavigationStructuralPreview
                menuKey="mobile_bottom_tabs"
                items={[
                    item({ id: 1, label: 'Projekt Name' }),
                    item({ id: 2, label: 'AGB', parent_item_id: 1 }),
                    item({ id: 3, label: 'profile', parent_item_id: 1 }),
                ]}
                pageById={noPages}
                resolvedLabelByItemId={labels([[1, 'Projekt Name'], [2, 'AGB'], [3, 'profile']])}
            />,
        );

        // Both rows are labelled, so the two-tab-bar layout is visible here
        // instead of only being discoverable by opening the app.
        expect(screen.getByText('Tab bar')).toBeInTheDocument();
        expect(screen.getByText('Top tabs')).toBeInTheDocument();
        expect(screen.getByText('AGB')).toBeInTheDocument();
        expect(screen.getByText('profile')).toBeInTheDocument();
    });

    it('keeps the flat row when no bottom tab has children', () => {
        renderWithProviders(
            <NavigationStructuralPreview
                menuKey="mobile_bottom_tabs"
                items={[item({ id: 1, label: 'Home' }), item({ id: 2, label: 'Info' })]}
                pageById={noPages}
                resolvedLabelByItemId={labels([[1, 'Home'], [2, 'Info']])}
            />,
        );

        expect(screen.queryByText('Top tabs')).not.toBeInTheDocument();
        expect(screen.queryByText('Tab bar')).not.toBeInTheDocument();
    });

    it('renders nothing for an empty menu', () => {
        renderWithProviders(
            <NavigationStructuralPreview
                menuKey="mobile_drawer"
                items={[]}
                pageById={noPages}
                resolvedLabelByItemId={labels([])}
            />,
        );

        expect(screen.queryByText('Structural preview')).not.toBeInTheDocument();
    });
});
