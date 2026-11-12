/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notifications } from '@mantine/notifications';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IImportAssetsResponse } from '../../../../../../api/admin/asset.api';

const { importAssets, exportAssets } = vi.hoisted(() => ({
    importAssets: vi.fn<(file: File) => Promise<IImportAssetsResponse>>(),
    exportAssets: vi.fn(),
}));

vi.mock('../../../../../../hooks/useAssets', () => ({
    useImportAssets: () => ({ mutateAsync: importAssets, isPending: false }),
    useExportAssets: () => ({ mutateAsync: exportAssets, isPending: false }),
}));

import { ExportImportAssetsModal } from '../ExportImportAssetsModal';

/**
 * Importing a bundle never turns a restricted asset into a public one: the
 * backend refuses an asset that names a group this site does not have, and
 * reports it in `errors` (no groups would mean public). The dialog must say so
 * before the import and show the reason after it, so the admin knows which
 * assets are missing and what to create.
 */
const BUNDLE = new File(['zip'], 'assets-2026-11-11.zip', { type: 'application/zip' });

async function openImportTab(): Promise<HTMLInputElement> {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ExportImportAssetsModal opened onClose={vi.fn()} />);
    await user.click(await screen.findByRole('tab', { name: /Import/ }));
    const input = container.ownerDocument.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
        throw new Error('The import tab has no file input');
    }
    return input;
}

async function importBundle(): Promise<void> {
    const input = await openImportTab();
    fireEvent.change(input, { target: { files: [BUNDLE] } });
    const user = userEvent.setup();
    const importButton = await screen.findByRole('button', { name: 'Import' }, { timeout: 4000 });
    await waitFor(() => expect(importButton).toBeEnabled());
    await user.click(importButton);
}

beforeEach(() => {
    importAssets.mockReset();
    exportAssets.mockReset();
    vi.spyOn(notifications, 'show').mockImplementation(() => '');
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ExportImportAssetsModal: import tab', () => {
    it('tells the admin how groups are matched and what happens to an unknown group', async () => {
        await openImportTab();

        expect(await screen.findByText(/Groups are matched by name/)).toBeInTheDocument();
        expect(screen.getByText(/not\s+imported, because without its groups it would become public/)).toBeInTheDocument();
        expect(screen.getByText(/create the group and import the bundle again/)).toBeInTheDocument();
        expect(screen.getByText(/never replaces existing files/)).toBeInTheDocument();
    });

    it('lists each refused asset with its reason and does not report a clean success', async () => {
        importAssets.mockResolvedValue({
            imported: 2,
            skipped: 1,
            errors: [{ file: 'staff-photo.png', error: 'Unknown group name(s): qa_group_missing_here' }],
        });

        await importBundle();

        await waitFor(() => expect(importAssets).toHaveBeenCalledWith(BUNDLE));
        const shown = vi.mocked(notifications.show).mock.calls.map(([notification]) => notification);
        expect(shown).toContainEqual(expect.objectContaining({
            title: 'Partial import',
            message: '2 imported, 1 skipped, 1 failed',
            color: 'yellow',
        }));
        // The reason stays on screen until dismissed: it names what to create.
        expect(shown).toContainEqual(expect.objectContaining({
            title: 'Failed: staff-photo.png',
            message: 'Unknown group name(s): qa_group_missing_here',
            color: 'red',
            autoClose: false,
        }));
        expect(shown.some((notification) => notification.title === 'Success')).toBe(false);
    }, 15_000);

    it('reports a clean import as a success with the skipped count', async () => {
        importAssets.mockResolvedValue({ imported: 3, skipped: 1, errors: [] });

        await importBundle();

        await waitFor(() => expect(importAssets).toHaveBeenCalledOnce());
        const shown = vi.mocked(notifications.show).mock.calls.map(([notification]) => notification);
        expect(shown).toContainEqual(expect.objectContaining({
            title: 'Success',
            message: 'Imported 3 assets, 1 skipped',
            color: 'green',
        }));
    }, 15_000);
});
