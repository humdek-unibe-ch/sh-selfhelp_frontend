/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { IconFiles, IconShieldLock } from '@tabler/icons-react';
import { renderWithProviders } from '../../../../../../../test-utils/renderWithProviders';
import { AdminNavbarRail } from '../AdminNavbarRail';
import type { TNavbarGroup } from '../../AdminNavbar';

const push = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
    usePathname: () => '/admin/users',
}));
vi.mock('../../../../../shared', () => ({
    AuthButton: () => <div data-testid="auth-button" />,
    PreviewModeToggle: () => <div data-testid="preview-toggle" />,
}));

const createPage = vi.fn();

const groups: TNavbarGroup[] = [
    {
        id: 'pages',
        label: 'Pages',
        icon: <IconFiles size={17} />,
        items: [{
            id: 'content-pages',
            label: 'Content Pages',
            links: [{ label: 'home', link: '/admin/pages/home', links: [{ label: 'home-child', link: '/admin/pages/home-child' }] }],
        }],
        actions: [{ id: 'create-page', label: 'Create page', icon: null, onClick: createPage }],
    },
    {
        id: 'users',
        label: 'Users & Access',
        icon: <IconShieldLock size={17} />,
        items: [{ id: 'nav:users', label: 'Users', link: '/admin/users' }],
    },
];

describe('collapsed admin navbar rail', () => {
    beforeEach(() => {
        push.mockClear();
        createPage.mockClear();
    });

    it('marks the section holding the current page as active', () => {
        renderWithProviders(<AdminNavbarRail groups={groups} onExpand={vi.fn()} onSearch={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Users & Access' })).toHaveAttribute('data-variant', 'light');
        expect(screen.getByRole('button', { name: 'Pages' })).toHaveAttribute('data-variant', 'subtle');
    });

    // jsdom gives every element a zero-size box, so Mantine marks the open flyout
    // as detached from its trigger and hides it; query hidden items too.
    it('opens a section flyout with its nested pages and quick actions', async () => {
        renderWithProviders(<AdminNavbarRail groups={groups} onExpand={vi.fn()} onSearch={vi.fn()} />);
        const menuItem = (name: string) => screen.findByRole('menuitem', { name, hidden: true });

        fireEvent.click(screen.getByRole('button', { name: 'Pages' }));

        expect(await menuItem('home-child')).toHaveAttribute('href', '/admin/pages/home-child');
        fireEvent.click(await menuItem('home'));
        expect(push).toHaveBeenCalledWith('/admin/pages/home');

        fireEvent.click(screen.getByRole('button', { name: 'Pages' }));
        fireEvent.click(await menuItem('Create page'));
        expect(createPage).toHaveBeenCalledTimes(1);
    });

    it('expands the sidebar from the rail', () => {
        const onExpand = vi.fn();
        const onSearch = vi.fn();
        renderWithProviders(<AdminNavbarRail groups={groups} onExpand={onExpand} onSearch={onSearch} />);

        fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
        fireEvent.click(screen.getByRole('button', { name: 'Search functions and pages' }));

        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledTimes(1);
    });
});
