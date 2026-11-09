/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * Regression guard for the core 0.1.41 delivery change.
 *
 * Asset bytes must come from `url` (the ACL-enforced delivery route). Building
 * a URL by concatenating `file_path` produced the old static `/uploads/assets/`
 * path, which 404s now that files live outside the document root — so the
 * fixture below deliberately gives the two fields DIFFERENT values, and the
 * assertions fail if anything reverts to `file_path`.
 */
const { hasPermission } = vi.hoisted(() => ({ hasPermission: vi.fn() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: () => ({
        data: {
            assets: [{
                id: 12,
                file_name: 'lamine-yamal-young.webp',
                file_path: 'uploads/assets/champ/lamine-yamal-young.webp',
                url: '/cms-api/v1/assets/champ/lamine-yamal-young.webp',
                folder: 'champ',
            }],
            pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
        },
        isLoading: false,
        error: null,
    }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAssetFolders: () => ({ data: { folders: [{ folder: 'champ', is_open_access: true }] } }),
}));

import { AssetsList } from '../AssetsList';
import { AssetThumbnail } from '../AssetThumbnail';

/**
 * The rendered URL goes through the BFF: Symfony authorizes from the bearer
 * header, which only the `/api/*` proxy attaches. Asserting the backend path
 * here would encode the anonymous-request bug.
 */
const DELIVERY_URL = '/api/assets/champ/lamine-yamal-young.webp';

describe('AssetsList asset delivery URLs', () => {
    beforeEach(() => {
        hasPermission.mockReset();
        hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_ASSET_READ);
    });

    it('builds the preview image from `url`, not `file_path`', async () => {
        renderWithProviders(<AssetsList />);
        const img = await screen.findByAltText('lamine-yamal-young.webp');
        expect(img).toHaveAttribute('src', DELIVERY_URL);
    });

    it('builds the View and Download links from `url`, not `file_path`', async () => {
        renderWithProviders(<AssetsList />);
        expect(await screen.findByRole('link', { name: /view/i })).toHaveAttribute('href', DELIVERY_URL);
        expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute('href', DELIVERY_URL);
    });

    it('never emits the unfetchable /uploads/assets path anywhere', async () => {
        const { container } = renderWithProviders(<AssetsList />);
        await screen.findByAltText('lamine-yamal-young.webp');
        expect(container.innerHTML).not.toContain('/uploads/assets/');
    });

    it('never points the browser straight at the backend delivery path', async () => {
        // That request would arrive anonymous (no bearer header), so an admin
        // would see nothing despite bypassing folder ACLs.
        const { container } = renderWithProviders(<AssetsList />);
        await screen.findByAltText('lamine-yamal-young.webp');
        expect(container.innerHTML).not.toContain('/cms-api/v1/assets/');
    });

    it('recovers from the placeholder when the same row gets a readable src', async () => {
        // Rows are keyed by `asset.id`, so this component is REUSED across
        // refetches. A bare boolean would latch the placeholder on forever —
        // e.g. after the folder is made public the image must come back.
        const { rerender } = renderWithProviders(
            <AssetThumbnail src="/api/assets/champ/x.webp" alt="x.webp" />
        );
        fireEvent.error(screen.getByAltText('x.webp'));
        expect(await screen.findByRole('img', { name: /no access/i })).toBeInTheDocument();

        rerender(<AssetThumbnail src="/api/assets/champ/x.webp?v=2" alt="x.webp" />);

        expect(screen.getByAltText('x.webp')).toBeInTheDocument();
        expect(screen.queryByRole('img', { name: /no access/i })).not.toBeInTheDocument();
    });

    it('shows a no-access placeholder instead of erroring when the image 403s', async () => {
        renderWithProviders(<AssetsList />);
        const img = await screen.findByAltText('lamine-yamal-young.webp');

        // A 403 on a closed folder surfaces to an <img> only as an error event.
        fireEvent.error(img);

        expect(await screen.findByRole('img', { name: /no access/i })).toBeInTheDocument();
        expect(screen.queryByAltText('lamine-yamal-young.webp')).not.toBeInTheDocument();
        // The row itself must survive — a denied image is expected, not a failure.
        expect(screen.getByText('lamine-yamal-young.webp')).toBeInTheDocument();
    });
});
