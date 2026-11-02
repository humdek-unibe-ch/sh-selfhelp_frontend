/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconDashboard } from '@tabler/icons-react';
import { renderWithProviders } from '../../../../../../../test-utils/renderWithProviders';
import { LinksGroup } from '../LinksGroup';

const push = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
    usePathname: () => '/admin/pages/teste',
}));

describe('admin navbar LinksGroup', () => {
    beforeEach(() => {
        push.mockClear();
        localStorage.clear();
    });

    it('renders an expandable group with an icon and a labelled chevron', () => {
        renderWithProviders(
            <LinksGroup
                label="User Management"
                icon={<IconDashboard size={16} />}
                links={[{ label: 'Users', link: '/admin/users' }]}
            />,
        );

        const chevron = screen.getByRole('button', { name: 'Expand User Management' });
        expect(chevron).toHaveAttribute('aria-expanded', 'false');
    });

    it('marks the page matching the current route as active', () => {
        renderWithProviders(
            <LinksGroup
                label="Content Pages"
                icon={<IconDashboard size={16} />}
                initiallyOpened
                links={[
                    { label: 'teste', link: '/admin/pages/teste' },
                    { label: 'impressum', link: '/admin/pages/impressum' },
                ]}
            />,
        );

        expect(screen.getByRole('link', { name: 'teste' })).toHaveAttribute('data-active', 'true');
        expect(screen.getByRole('link', { name: 'impressum' })).toHaveAttribute('data-active', 'false');
    });

    it('collapses an open group when its chevron is clicked', async () => {
        // Seed the persisted value: `usePersistedDisclosure` swallows the very
        // first toggle of a group that has no stored value yet.
        localStorage.setItem('navbar-content-pages-opened', 'true');

        renderWithProviders(
            <LinksGroup
                label="Content Pages"
                icon={<IconDashboard size={16} />}
                links={[{ label: 'impressum', link: '/admin/pages/impressum' }]}
            />,
        );

        const collapse = screen.getByRole('button', { name: 'Collapse Content Pages' });
        expect(collapse).toHaveAttribute('aria-expanded', 'true');

        await userEvent.click(collapse);
        expect(
            screen.getByRole('button', { name: 'Expand Content Pages' }),
        ).toHaveAttribute('aria-expanded', 'false');
    });

    it('navigates when a page link is clicked', async () => {
        renderWithProviders(
            <LinksGroup
                label="Content Pages"
                icon={<IconDashboard size={16} />}
                initiallyOpened
                links={[{ label: 'impressum', link: '/admin/pages/impressum' }]}
            />,
        );

        await userEvent.click(screen.getByRole('link', { name: 'impressum' }));
        expect(push).toHaveBeenCalledWith('/admin/pages/impressum');
    });
});
