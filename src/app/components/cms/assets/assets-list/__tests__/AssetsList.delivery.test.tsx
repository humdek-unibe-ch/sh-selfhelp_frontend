/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * Regression guard for asset delivery.
 *
 * Asset bytes must come from `url` (the access-checked delivery route),
 * re-addressed onto the BFF so the request carries the user's identity.
 */
const { hasPermission } = vi.hoisted(() => ({ hasPermission: vi.fn() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useGroups', () => ({
    useAllGroups: () => ({ data: { groups: [] }, isLoading: false }),
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: () => ({
        data: {
            assets: [{
                id: 12,
                uuid: '0b8f4c2e-7a1d-4e5f-9a3b-2c6d8e0f1a2b',
                name: 'lamine-yamal-young.webp',
                url: '/cms-api/v1/assets/0b8f4c2e-7a1d-4e5f-9a3b-2c6d8e0f1a2b',
                mime_type: 'image/webp',
                size: 2048,
                alt: null,
                groups: [{ id: 4, name: 'subject' }],
                can_view: true,
                can_update: false,
                can_delete: false,
                created_at: '2026-11-03T10:00:00+00:00',
                updated_at: '2026-11-03T10:00:00+00:00',
            }],
            pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
        },
        isLoading: false,
        error: null,
    }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkAssetGroups: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkDeleteAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkMoveAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAssetFolders: () => ({ data: [] }),
    useSaveAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteAssetFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { AssetsList } from '../AssetsList';
import { AssetThumbnail } from '../AssetThumbnail';

/**
 * The rendered URL goes through the BFF: Symfony authorizes from the bearer
 * header, which only the `/api/*` proxy attaches. Asserting the backend path
 * here would encode the anonymous-request bug.
 */
const DELIVERY_URL = '/api/assets/0b8f4c2e-7a1d-4e5f-9a3b-2c6d8e0f1a2b';

describe('AssetsList asset delivery URLs', () => {
    beforeEach(() => {
        hasPermission.mockReset();
        hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_ASSET_READ);
    });

    it('builds the preview image from `url`', async () => {
        renderWithProviders(<AssetsList />);
        const img = await screen.findByAltText('lamine-yamal-young.webp');
        expect(img).toHaveAttribute('src', DELIVERY_URL);
    });

    it('builds the View and Download links from `url`', async () => {
        renderWithProviders(<AssetsList />);
        expect(await screen.findByRole('link', { name: /view/i })).toHaveAttribute('href', DELIVERY_URL);
        const download = screen.getByRole('link', { name: /download/i });
        expect(download).toHaveAttribute('href', DELIVERY_URL);
        // No name forced: the server names the saved file `<uuid>.<extension>`.
        expect(download).toHaveAttribute('download', '');
    });

    it('never points the browser straight at the backend delivery path', async () => {
        // That request would arrive anonymous (no bearer header), so an admin
        // would see nothing despite bypassing asset groups.
        const { container } = renderWithProviders(<AssetsList />);
        await screen.findByAltText('lamine-yamal-young.webp');
        expect(container.innerHTML).not.toContain('/cms-api/v1/assets/');
    });

    it('recovers from the placeholder when the same row gets a readable src', async () => {
        // Rows are keyed by `asset.id`, so this component is REUSED across
        // refetches. A bare boolean would latch the placeholder on forever —
        // e.g. after the file is replaced the image must come back.
        const { rerender } = renderWithProviders(
            <AssetThumbnail src="/api/assets/x" alt="x.webp" canView />
        );
        fireEvent.error(screen.getByAltText('x.webp'));
        expect(await screen.findByRole('img', { name: /preview unavailable/i })).toBeInTheDocument();

        rerender(<AssetThumbnail src="/api/assets/x?v=2" alt="x.webp" canView />);

        expect(screen.getByAltText('x.webp')).toBeInTheDocument();
        expect(screen.queryByRole('img', { name: /preview unavailable/i })).not.toBeInTheDocument();
    });

    it('says "preview unavailable", not "no access", when an image the caller may view fails to load', async () => {
        renderWithProviders(<AssetsList />);
        const img = await screen.findByAltText('lamine-yamal-young.webp');

        // A missing file, a decode failure or a network error surfaces to an <img>
        // only as an error event; the server said the caller may view it, so this
        // cannot be a permission problem.
        fireEvent.error(img);

        expect(await screen.findByRole('img', { name: /preview unavailable/i })).toBeInTheDocument();
        expect(screen.queryByRole('img', { name: /no access/i })).not.toBeInTheDocument();
        expect(screen.queryByAltText('lamine-yamal-young.webp')).not.toBeInTheDocument();
        // The row itself must survive — a failed preview is not a failure of the list.
        expect(screen.getByText('lamine-yamal-young.webp')).toBeInTheDocument();
    });

    it('shows the "no access" lock, without requesting the image, only when the server says the caller may not view it', () => {
        renderWithProviders(<AssetThumbnail src="/api/assets/x" alt="x.webp" canView={false} />);

        expect(screen.getByRole('img', { name: /no access/i })).toBeInTheDocument();
        expect(screen.queryByAltText('x.webp')).not.toBeInTheDocument();
    });
});
