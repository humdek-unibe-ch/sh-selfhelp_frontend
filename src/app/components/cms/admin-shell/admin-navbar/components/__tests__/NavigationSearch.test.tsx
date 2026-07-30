/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../../test-utils/renderWithProviders';
import { NavigationSearch } from '../NavigationSearch';

const push = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
    usePathname: () => '/admin',
}));

// The search index is permission-gated; grant the reads this spec relies on so
// "Assets" is a stable, predictable row to assert against.
vi.mock('../../../../../../../hooks/useAuth', () => ({
    useAuth: () => ({
        hasPermission: () => true,
        permissionChecker: {
            canManageUsers: () => false,
            canReadUsers: () => false,
            canReadGroups: () => false,
            canReadRoles: () => false,
            canManageAssets: () => true,
            canReadAssets: () => true,
            canDeleteSections: () => false,
            canManageActions: () => false,
            canManageScheduledJobs: () => false,
            canReadActions: () => false,
            canReadScheduledJobs: () => false,
            canManageLanguages: () => false,
            canAccessDataBrowser: () => false,
            canViewAuditLogs: () => false,
            canReadCache: () => false,
            canManagePlugins: () => false,
        },
    }),
}));

vi.mock('../../../../../frontend/plugin-runtime', () => ({
    usePluginMenuItems: () => [],
}));

function renderSearch() {
    return renderWithProviders(
        <div>
            <button type="button">outside</button>
            <NavigationSearch adminPagesData={{}} onItemSelect={() => {}} />
        </div>,
    );
}

const getInput = () => screen.getByPlaceholderText('Search functions & pages');

describe('NavigationSearch results panel', () => {
    beforeEach(() => {
        push.mockClear();
    });

    it('opens the results panel once a query is typed', async () => {
        renderSearch();

        await userEvent.type(getInput(), 'a');

        expect(screen.getByRole('listbox', { name: 'Search results' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Assets/ })).toBeInTheDocument();
    });

    // The docked look depends on this attribute reaching the <input>, where the
    // CSS module flattens its bottom corners against the panel.
    it('marks the input as docked only while the panel is showing', async () => {
        renderSearch();

        expect(getInput()).not.toHaveAttribute('data-panel-open');

        await userEvent.type(getInput(), 'a');
        expect(getInput()).toHaveAttribute('data-panel-open');

        await userEvent.keyboard('{Escape}');
        expect(getInput()).not.toHaveAttribute('data-panel-open');
    });

    it('closes the panel when clicking outside, keeping the typed query', async () => {
        renderSearch();

        await userEvent.type(getInput(), 'a');
        expect(screen.getByRole('listbox', { name: 'Search results' })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'outside' }));

        expect(screen.queryByRole('listbox', { name: 'Search results' })).toBeNull();
        expect(getInput()).toHaveValue('a');
    });

    it('closes the panel on Escape without clearing the query', async () => {
        renderSearch();

        await userEvent.type(getInput(), 'a');
        await userEvent.keyboard('{Escape}');

        expect(screen.queryByRole('listbox', { name: 'Search results' })).toBeNull();
        expect(getInput()).toHaveValue('a');
    });

    it('reopens the panel when the input is clicked again after dismissal', async () => {
        renderSearch();

        await userEvent.type(getInput(), 'a');
        await userEvent.keyboard('{Escape}');
        expect(screen.queryByRole('listbox', { name: 'Search results' })).toBeNull();

        await userEvent.click(getInput());

        expect(screen.getByRole('listbox', { name: 'Search results' })).toBeInTheDocument();
    });

    it('closes the panel and clears the query after selecting a result', async () => {
        renderSearch();

        await userEvent.type(getInput(), 'a');
        await userEvent.click(screen.getByRole('option', { name: /Assets/ }));

        expect(push).toHaveBeenCalledWith('/admin/assets');
        expect(screen.queryByRole('listbox', { name: 'Search results' })).toBeNull();
        expect(getInput()).toHaveValue('');
    });

    it('closes the panel when the clear button is pressed', async () => {
        renderSearch();

        await userEvent.type(getInput(), 'a');
        await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

        expect(screen.queryByRole('listbox', { name: 'Search results' })).toBeNull();
        expect(getInput()).toHaveValue('');
    });
});
