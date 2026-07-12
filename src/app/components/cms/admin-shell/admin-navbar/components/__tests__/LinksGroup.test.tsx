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

    it('renders a page category as a plain section heading, with no icon row control', () => {
        renderWithProviders(
            <LinksGroup
                label="Menu Pages"
                variant="section"
                initiallyOpened
                links={[{ label: 'teste', link: '/admin/pages/teste' }]}
            />,
        );

        // The heading itself is the disclosure control...
        const heading = screen.getByRole('button', { name: 'Menu Pages' });
        expect(heading).toHaveAttribute('aria-expanded', 'true');

        // ...and unlike a functional group there is no separate labelled chevron.
        expect(screen.queryByRole('button', { name: /Collapse Menu Pages/ })).toBeNull();
        expect(screen.queryByRole('button', { name: /Expand Menu Pages/ })).toBeNull();

        expect(screen.getByRole('link', { name: 'teste' })).toBeInTheDocument();
    });

    it('marks the page matching the current route as active', () => {
        renderWithProviders(
            <LinksGroup
                label="Menu Pages"
                variant="section"
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

    it('keeps the functional group as an icon row with its own labelled chevron', () => {
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

    it('collapses an open section when its heading is clicked', async () => {
        // Seed the persisted value: `usePersistedDisclosure` swallows the very
        // first toggle of a group that has no stored value yet.
        localStorage.setItem('navbar-footer-pages-opened', 'true');

        renderWithProviders(
            <LinksGroup
                label="Footer Pages"
                variant="section"
                links={[{ label: 'impressum', link: '/admin/pages/impressum' }]}
            />,
        );

        const heading = screen.getByRole('button', { name: 'Footer Pages' });
        expect(heading).toHaveAttribute('aria-expanded', 'true');

        await userEvent.click(heading);
        expect(heading).toHaveAttribute('aria-expanded', 'false');
    });

    it('navigates when a page link is clicked', async () => {
        renderWithProviders(
            <LinksGroup
                label="Footer Pages"
                variant="section"
                initiallyOpened
                links={[{ label: 'impressum', link: '/admin/pages/impressum' }]}
            />,
        );

        await userEvent.click(screen.getByRole('link', { name: 'impressum' }));
        expect(push).toHaveBeenCalledWith('/admin/pages/impressum');
    });
});
