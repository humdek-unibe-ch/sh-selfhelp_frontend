/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { CmsAppsPage } from '../CmsAppsPage';

const useCmsAppsQuery = vi.fn();
const canCreateCmsApps = vi.fn(() => true);

vi.mock('../../../../../hooks/useCmsApps', () => ({
    useCmsAppsQuery: (...args: unknown[]) => useCmsAppsQuery(...args),
}));

vi.mock('../../../../../hooks/useAuth', () => ({
    useAuth: () => ({
        permissionChecker: {
            canReadCmsApps: () => true,
            canCreateCmsApps,
            canDeleteCmsApps: () => true,
        },
    }),
}));

vi.mock('../CreateCmsAppModal', () => ({
    CreateCmsAppModal: () => null,
}));

vi.mock('../DeleteCmsAppModal', () => ({
    DeleteCmsAppModal: () => null,
}));

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

describe('CmsAppsPage', () => {
    beforeEach(() => {
        useCmsAppsQuery.mockReset();
        canCreateCmsApps.mockReturnValue(true);
    });

    it('lists apps with links to the slug detail route', () => {
        useCmsAppsQuery.mockReturnValue({
            data: [
                {
                    id: 3,
                    name: 'Team members',
                    slug: 'team-members',
                    description: null,
                    page_count: 4,
                    id_form_section: null,
                    id_cms_list_page: 10,
                    cms_list_keyword: 'cms-team-members',
                    cms_list_url: '/cms/team-members',
                    id_cms_detail_page: null,
                    id_public_list_page: null,
                    public_list_keyword: null,
                    public_list_url: null,
                    id_public_detail_page: null,
                    created_at: '2026-07-08T00:00:00+00:00',
                    updated_at: null,
                },
            ],
            isLoading: false,
            error: null,
        });

        renderWithProviders(<CmsAppsPage />);

        expect(screen.getByRole('heading', { name: 'CMS Apps' })).toBeInTheDocument();
        const link = screen.getByRole('link', { name: 'Team members' });
        expect(link).toHaveAttribute('href', '/admin/cms-apps/team-members');
        expect(screen.getByRole('link', { name: /Manage content/i })).toHaveAttribute(
            'href',
            '/admin/cms-apps/team-members/content',
        );
        expect(screen.getByRole('button', { name: /create app/i })).toBeInTheDocument();
    });

    it('shows an empty state when there are no apps', () => {
        useCmsAppsQuery.mockReturnValue({
            data: [],
            isLoading: false,
            error: null,
        });

        renderWithProviders(<CmsAppsPage />);

        expect(screen.getByText(/no cms apps yet/i)).toBeInTheDocument();
    });
});
