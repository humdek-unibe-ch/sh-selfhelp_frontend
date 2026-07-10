/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import type { INavigationBundle } from '../../../../../types/requests/admin/navigation-export-import.types';

const {
    exportNavigation,
    validateNavigationImport,
    importNavigation,
    mutateAsync,
} = vi.hoisted(() => ({
    exportNavigation: vi.fn(),
    validateNavigationImport: vi.fn(),
    importNavigation: vi.fn(),
    mutateAsync: vi.fn(),
}));

vi.mock('../../../../../api/admin/navigation.api', () => ({
    AdminNavigationApi: {
        exportNavigation,
        validateNavigationImport,
        importNavigation,
    },
}));

vi.mock('../../../../../hooks/usePermissionChecks', () => ({
    useCanExportNavigation: () => true,
    useCanImportNavigation: () => true,
}));

vi.mock('../../../../../hooks/useAdminPages', () => ({
    useAdminPages: () => ({
        pages: [
            { id_pages: 10, keyword: 'qa-demo-home' },
            { id_pages: 11, keyword: 'qa-demo-about' },
        ],
        isLoading: false,
    }),
}));

vi.mock('../../../../../hooks/useGroups', () => ({
    useGroups: () => ({
        data: { groups: [] },
        isLoading: false,
    }),
}));

vi.mock('../../../../../hooks/mutations/useImportNavigationMutation', () => ({
    useImportNavigationMutation: () => ({
        mutate: mutateAsync,
        isPending: false,
    }),
}));

vi.mock('../../../../../utils/export-import.utils', () => ({
    downloadJsonFile: vi.fn(),
}));

import { NavigationExportImportPanel } from '../NavigationExportImportPanel';

const bundle: INavigationBundle = {
    format: 'selfhelp/navigation-bundle',
    version: '2.0',
    menus: {
        web_header: {
            items: [{ ref: 'home', parent_ref: null, item_type: 'page', position: 10, page_keyword: 'demo-home' }],
        },
    },
};

function setup() {
    return renderWithProviders(<NavigationExportImportPanel onImported={vi.fn()} />);
}

describe('NavigationExportImportPanel', () => {
    beforeEach(() => {
        exportNavigation.mockReset();
        validateNavigationImport.mockReset();
        importNavigation.mockReset();
        mutateAsync.mockReset();
        exportNavigation.mockResolvedValue(bundle);
        validateNavigationImport.mockResolvedValue({ valid: true, issues: [] });
    });

    it('renders export and import tabs with guidance copy', () => {
        setup();
        expect(screen.getByText(/Page bundles contain content only/i)).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Export/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Import/i })).toBeInTheDocument();
        expect(screen.queryByText(/virtual children/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/page_children/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Manage exclusions/i)).not.toBeInTheDocument();
    });

    it('calls full snapshot export with include flags', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByLabelText('Include referenced pages'));
        await user.click(screen.getByLabelText('Include navigation settings'));
        await user.click(screen.getByRole('button', { name: /Preview export/i }));

        await waitFor(() => expect(exportNavigation).toHaveBeenCalledTimes(1));
        expect(exportNavigation).toHaveBeenCalledWith({
            exportMode: 'full_snapshot',
            includePages: true,
            includeSettings: true,
            keywordPrefix: '',
            selectedPageIds: undefined,
        });
    });

    it('requires selected pages for branch export preview', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByText('Branch export'));
        const previewBtn = screen.getByRole('button', { name: /Preview export/i });
        expect(previewBtn).toBeDisabled();

        await user.click(screen.getByPlaceholderText('Select one or more pages'));
        await user.click(await screen.findByText('qa-demo-home (#10)'));
        await user.click(previewBtn);

        await waitFor(() => expect(exportNavigation).toHaveBeenCalledWith({
            exportMode: 'branch',
            includePages: false,
            includeSettings: false,
            keywordPrefix: '',
            selectedPageIds: [10],
        }));
    });

    it('validates pasted import JSON and shows warnings', async () => {
        const user = userEvent.setup();
        validateNavigationImport.mockResolvedValue({
            valid: true,
            issues: [{ level: 'warning', code: 'version_mismatch', message: 'Version differs', menu_key: null }],
        });
        setup();

        await user.click(screen.getByRole('tab', { name: /Import/i }));
        await user.click(screen.getByLabelText('Or paste JSON'));
        await user.paste(JSON.stringify(bundle));
        await user.click(screen.getByRole('button', { name: /Validate import/i }));

        await waitFor(() => expect(validateNavigationImport).toHaveBeenCalled());
        expect(screen.getByText('Version differs')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Import navigation/i })).toBeEnabled();
    });

    it('disables import when validation returns errors', async () => {
        const user = userEvent.setup();
        validateNavigationImport.mockResolvedValue({
            valid: false,
            issues: [{ level: 'error', code: 'missing_page', message: 'Page missing', menu_key: 'web_header' }],
        });
        setup();

        await user.click(screen.getByRole('tab', { name: /Import/i }));
        await user.click(screen.getByLabelText('Or paste JSON'));
        await user.paste(JSON.stringify(bundle));
        await user.click(screen.getByRole('button', { name: /Validate import/i }));

        await waitFor(() => expect(validateNavigationImport).toHaveBeenCalled());
        expect(screen.getByRole('alert', { name: /Errors/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Import navigation/i })).toBeDisabled();
    });

    it('shows strong replace warning and opens confirmation before import', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByRole('tab', { name: /Import/i }));
        await user.click(screen.getByLabelText('Or paste JSON'));
        await user.paste(JSON.stringify(bundle));
        await user.click(screen.getByRole('button', { name: /Demo reset mode/i }));
        expect(screen.getByText(/This will replace existing items in selected menus/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Validate import/i }));
        await waitFor(() => expect(validateNavigationImport).toHaveBeenCalled());

        await user.click(screen.getByRole('button', { name: /^Import navigation$/i }));
        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText(/cannot be undone automatically/i)).toBeInTheDocument();

        await user.click(within(dialog).getByRole('button', { name: /^Import navigation$/i }));
        expect(mutateAsync).toHaveBeenCalledWith({ bundle, options: expect.objectContaining({
            keywordPrefix: '',
            menuPolicies: expect.objectContaining({ web_header: 'replace' }),
        }) });
    });
});
