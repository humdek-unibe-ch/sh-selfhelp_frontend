/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The admin menu and its search draw static screens from the screen registry,
 * each entry on its own read permission (rule 4.13). F241: Unused Sections
 * hid behind an asset right; Automation behind an any-of gate.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PermissionChecker } from '../../../../../../utils/permissions.utils';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

const auth = vi.hoisted(() => ({ permissions: [] as string[] }));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => '/admin',
}));

vi.mock('../../../../../../hooks/useAuth', async () => {
    const { PermissionChecker: Checker } = await import('../../../../../../utils/permissions.utils');
    return {
        useAuth: () => ({
            hasPermission: (permission: string) => auth.permissions.includes(permission),
            permissionChecker: new Checker(auth.permissions),
        }),
    };
});

vi.mock('../../../../../../hooks/useAdminPages', () => ({
    useAdminPages: () => ({
        pages: [],
        configurationPageLinks: [],
        categorizedSystemPages: { authentication: [], profile: [], errors: [], legal: [], other: [] },
        categorizedRegularPages: { menu: [], footer: [], other: [] },
        isLoading: false,
    }),
}));

vi.mock('../../../../../../hooks/useCmsApps', () => ({
    useCmsAppsQuery: () => ({ data: [] }),
}));

vi.mock('../../../../frontend/plugin-runtime/PluginsProvider', () => ({
    usePluginMenuItems: () => [],
}));

vi.mock('../../../../frontend/plugin-runtime', () => ({
    usePluginMenuItems: () => [],
}));

vi.mock('../../../pages/create-page/CreatePage', () => ({ CreatePageModal: () => null }));
vi.mock('../../../cms-apps/CreateCmsAppModal', () => ({ CreateCmsAppModal: () => null }));
vi.mock('../../../pages/admin-pages-list/PageExportImportModal', () => ({ PageExportImportModal: () => null }));
vi.mock('../AdminNavbarHeader', () => ({ AdminNavbarHeader: () => null }));
vi.mock('../../../../shared', () => ({ AuthButton: () => null }));
// Entries render as plain links carrying their menu id, so the test reads
// ids, labels and order directly (collapsed panels included).
vi.mock('../components/LinksGroup', () => ({
    LinksGroup: ({ id, label, link }: { id: string; label: string; link?: string }) => (
        <a data-nav-id={id} href={link ?? '#'}>{label}</a>
    ),
    NavDirectLink: ({ label, link }: { label: string; link: string }) => <a href={link}>{label}</a>,
}));

import { AdminNavbar } from '../AdminNavbar';

/** Every static menu entry, in order, as `id label`: hidden panels included. */
function menuEntries(container: HTMLElement): string[] {
    return Array.from(container.querySelectorAll<HTMLElement>('[data-nav-id]')).map(
        (el) => `${el.dataset.navId ?? ''} ${el.textContent ?? ''}`,
    );
}

/** Static entry labels plus accordion group labels. */
function menuLabels(container: HTMLElement): string[] {
    const entries = Array.from(container.querySelectorAll<HTMLElement>('[data-nav-id]')).map((el) => el.textContent ?? '');
    const groups = screen.queryAllByRole('button').map((b) => b.textContent ?? '');
    return [...entries, ...groups];
}

async function searchLabels(query: string): Promise<string[]> {
    await userEvent.clear(screen.getByPlaceholderText('Search functions & pages'));
    await userEvent.type(screen.getByPlaceholderText('Search functions & pages'), query);
    const results = screen.queryByRole('navigation', { name: 'Search results' });
    if (!results) return [];
    return within(results).queryAllByRole('link').map((a) => a.textContent ?? '');
}

function renderAs(...permissions: string[]) {
    auth.permissions = permissions;
    return renderWithProviders(<AdminNavbar />);
}

describe('AdminNavbar static screens from the registry', () => {
    beforeEach(() => {
        auth.permissions = [];
        localStorage.clear();
    });

    it('shows Unused Sections in menu and search for a role with only the section read right (F241)', async () => {
        const { container } = renderAs(PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_SECTION_READ);

        const labels = menuLabels(container);
        expect(labels).toContain('Content');
        expect(labels).toContain('Unused Sections');
        expect(labels).not.toContain('Assets');

        expect(await searchLabels('unused')).toEqual(expect.arrayContaining([expect.stringContaining('Unused Sections')]));
        expect((await searchLabels('assets')).some((l) => l.includes('Assets'))).toBe(false);
    });

    it('shows Assets and not Unused Sections for a role with only the asset read right', async () => {
        const { container } = renderAs(PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_ASSET_READ);

        const labels = menuLabels(container);
        expect(labels).toContain('Assets');
        expect(labels).not.toContain('Unused Sections');

        expect((await searchLabels('assets')).some((l) => l.includes('Assets'))).toBe(true);
        expect((await searchLabels('unused')).some((l) => l.includes('Unused Sections'))).toBe(false);
    });

    it('shows Scheduled Jobs and Jobs Calendar, not Actions, for a role with only the scheduled job read right', () => {
        const { container } = renderAs(PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_SCHEDULED_JOB_READ);

        const labels = menuLabels(container);
        expect(labels).toContain('Automation');
        expect(labels).toContain('Scheduled Jobs');
        expect(labels).toContain('Jobs Calendar');
        expect(labels).not.toContain('Actions');
    });

    it('gives a superuser the same static entries, ids and order as before the registry', () => {
        const all = Object.values(PERMISSIONS);
        const { container } = renderAs(...all);
        expect(new PermissionChecker(all).canManagePlugins()).toBe(true);

        // Recorded from the menu before the change (admin holding every permission).
        expect(menuEntries(container)).toEqual([
            'cms-apps:index All apps',
            'cms-app-configs:index All apps',
            'menu-pages Web header',
            'footer-pages Web footer',
            'mobile-drawer-pages Mobile drawer',
            'mobile-tabs-pages Mobile tabs',
            'nav:users Users',
            'nav:groups Groups',
            'nav:roles Roles',
            'nav:registration-codes Registration Codes',
            'nav:assets Assets',
            'nav:unused-sections Unused Sections',
            'nav:actions Actions',
            'nav:scheduled-jobs Scheduled Jobs',
            'nav:scheduled-jobs-calendar Jobs Calendar',
            'nav:languages Languages',
            'nav:data-browser Data Browser',
            'nav:audit-logs Audit Logs',
            'nav:cache Cache Management',
            'nav:system System Maintenance',
            'nav:plugin-management Plugin Management',
        ]);
    });
});
