/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { INavigationBundle } from '../../../../../../types/requests/admin/navigation-export-import.types';

const {
    getExampleBundles,
    validateImportPages,
    validateNavigationImport,
    importPagesMutate,
    importNavigationMutate,
} = vi.hoisted(() => ({
    getExampleBundles: vi.fn(),
    validateImportPages: vi.fn(),
    validateNavigationImport: vi.fn(),
    importPagesMutate: vi.fn(),
    importNavigationMutate: vi.fn(),
}));

vi.mock('../../../../../../api/admin', () => ({
    AdminApi: {
        getExampleBundles,
        validateImportPages,
        suggestExportBundle: vi.fn(),
        exportPages: vi.fn(),
    },
}));

vi.mock('../../../../../../api/admin/navigation.api', () => ({
    AdminNavigationApi: {
        validateNavigationImport,
    },
}));

vi.mock('../../../../../../hooks/mutations', () => ({
    useImportPagesMutation: () => ({ mutate: importPagesMutate, isPending: false }),
    useImportNavigationMutation: () => ({ mutate: importNavigationMutate, isPending: false }),
}));

vi.mock('../../../../../../hooks/useGroups', () => ({
    useGroups: () => ({
        data: {
            groups: [
                { id: 1, name: 'admin', description: null, id_group_types: null, requires_2fa: false, users_count: 1, acls: [] },
                { id: 2, name: 'subject', description: null, id_group_types: null, requires_2fa: false, users_count: 1, acls: [] },
                { id: 3, name: 'therapist', description: null, id_group_types: null, requires_2fa: false, users_count: 1, acls: [] },
            ],
        },
        isLoading: false,
    }),
}));

import { PageExportImportModal } from '../PageExportImportModal';

const navigationBundle: INavigationBundle = {
    format: 'selfhelp/navigation-bundle',
    version: '2.0',
    import_hints: {
        default_keyword_prefix: 'demo-',
        default_route_prefix: '',
    },
    menus: {
        web_header: {
            items: [
                { ref: 'home', parent_ref: null, item_type: 'page', position: 10, page_keyword: 'demo-home' },
            ],
        },
    },
    pages: [
        { keyword: 'demo-home', url: '/demo-home' },
        { keyword: 'demo-about', url: '/demo-about' },
    ],
} as INavigationBundle;

function setup() {
    return renderWithProviders(
        <PageExportImportModal opened onClose={vi.fn()} pages={[]} />,
    );
}

describe('PageExportImportModal — navigation bundle routing', () => {
    beforeEach(() => {
        getExampleBundles.mockReset();
        validateImportPages.mockReset();
        validateNavigationImport.mockReset();
        importPagesMutate.mockReset();
        importNavigationMutate.mockReset();
        getExampleBundles.mockResolvedValue([
            {
                id: 'menu-demo',
                title: 'Navigation menu demo',
                description: 'Menus + embedded pages',
                page_count: 2,
                bundle: navigationBundle,
            },
        ]);
        validateNavigationImport.mockResolvedValue({ valid: true, issues: [] });
    });

    it('loads a navigation example with its hint prefixes and routes validate/import to the navigation API', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByRole('tab', { name: /Start from template/ }));
        expect(await screen.findByText('Navigation menu demo')).toBeInTheDocument();
        expect(screen.getByText('navigation + pages')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Use this template/ }));

        // Jumped to the Import tab with the bundle summary + hint-seeded prefixes.
        expect(await screen.findByText(/Navigation bundle loaded:/)).toBeInTheDocument();
        expect(screen.getByText(/embedded page\(s\)/)).toBeInTheDocument();
        expect(screen.getByLabelText('Keyword prefix')).toHaveValue('demo-');
        expect(screen.getByLabelText('Route prefix')).toHaveValue('');

        // Validate goes to the NAVIGATION endpoint, not the pages endpoint.
        await user.click(screen.getByRole('button', { name: 'Validate' }));
        await waitFor(() => expect(validateNavigationImport).toHaveBeenCalledTimes(1));
        expect(validateImportPages).not.toHaveBeenCalled();
        const [sentBundle, sentOptions] = validateNavigationImport.mock.calls[0];
        expect(sentBundle.format).toBe('selfhelp/navigation-bundle');
        expect(sentOptions).toMatchObject({
            keywordPrefix: 'demo-',
            routePrefix: '',
            missingPagesMode: 'strict',
            activateRoutes: true,
        });

        expect(await screen.findByText('Bundle is valid')).toBeInTheDocument();

        // Import also goes to the navigation importer.
        await user.click(screen.getByRole('button', { name: 'Import' }));
        expect(importNavigationMutate).toHaveBeenCalledTimes(1);
        expect(importPagesMutate).not.toHaveBeenCalled();
        expect(importNavigationMutate.mock.calls[0][0]).toMatchObject({
            options: { keywordPrefix: 'demo-', missingPagesMode: 'strict' },
        });
    });

    it('keeps plain page bundles on the pages import endpoint', async () => {
        getExampleBundles.mockResolvedValue([
            {
                id: 'cms-demo',
                title: 'Plain page demo',
                description: null,
                page_count: 1,
                bundle: {
                    format: 'selfhelp/page-bundle',
                    version: '1.0',
                    pages: [{ keyword: 'demo', url: '/demo' }],
                },
            },
        ]);
        validateImportPages.mockResolvedValue({ valid: true, issues: [] });
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByRole('tab', { name: /Start from template/ }));
        await user.click(await screen.findByRole('button', { name: /Use this template/ }));

        // Page-bundle templates seed BOTH demo prefixes derived from their id
        // (the backend rewrites in-bundle content links to the route prefix).
        expect(await screen.findByText(/Bundle loaded:/)).toBeInTheDocument();
        expect(screen.getByLabelText('Keyword prefix')).toHaveValue('demo_cms_demo_');
        expect(screen.getByLabelText('Route prefix')).toHaveValue('/demo-cms-demo');

        await user.click(screen.getByRole('button', { name: 'Validate' }));
        await waitFor(() => expect(validateImportPages).toHaveBeenCalledTimes(1));
        expect(validateNavigationImport).not.toHaveBeenCalled();

        await user.click(await screen.findByRole('button', { name: 'Import' }));
        expect(importPagesMutate).toHaveBeenCalledTimes(1);
        expect(importNavigationMutate).not.toHaveBeenCalled();
    });

    it('hides the admin group from viewer-group options (admin is always granted)', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByRole('tab', { name: /Import/ }));

        expect(screen.getByText(/admin group is always granted full access automatically/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Optional — admins already have access')).toBeInTheDocument();

        // Open the searchable MultiSelect via its visible input field.
        await user.click(screen.getByPlaceholderText('Optional — admins already have access'));

        expect(await screen.findByText('subject')).toBeInTheDocument();
        expect(screen.getByText('therapist')).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'admin' })).not.toBeInTheDocument();
    });
});
