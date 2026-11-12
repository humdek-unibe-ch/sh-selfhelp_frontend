/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * Regression guard: the Type column must be derived from the FILE EXTENSION.
 *
 * `asset_type` is a storage category with only three values — `css`, `asset`,
 * `static`. Reading it first meant nearly every upload came back as `asset`,
 * matched no branch, and rendered as "Other" for every row. Each fixture below
 * therefore carries a realistic `asset_type` that must NOT win.
 */
const { hasPermission } = vi.hoisted(() => ({ hasPermission: vi.fn() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission }, user: null, isLoading: false, error: null }),
}));
vi.mock('../../../../../../hooks/useGroups', () => ({
    useAllGroups: () => ({ data: { groups: [] }, isLoading: false }),
}));

/** Only the photo and the GIF record a MIME type: the rest must be typed by the extension in their name. */
const asset = (id: number, name: string, asset_type: string, mime_type: string | null = null) => ({
    id,
    uuid: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    name,
    asset_type,
    url: `/cms-api/v1/assets/00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    mime_type,
    size: 1,
    alt: null,
    groups: [],
    can_view: true,
    can_update: true,
    can_delete: true,
    created_at: '2026-11-03T10:00:00+00:00',
    updated_at: '2026-11-03T10:00:00+00:00',
});

vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: () => ({
        data: {
            assets: [
                asset(1, 'photo.webp', 'asset', 'image/webp'),
                asset(2, 'clip.mp4', 'asset'),
                asset(3, 'theme.css', 'css'),
                asset(4, 'report.pdf', 'asset'),
                asset(5, 'data.csv', 'asset'),
                asset(6, 'track.mp3', 'asset'),
                asset(7, 'brand.woff2', 'asset'),
                asset(8, 'bundle.zip', 'asset'),
                asset(9, 'notes.txt', 'asset'),
                asset(10, 'mystery.xyz', 'asset'),
                asset(11, 'README', 'asset'),
                asset(12, 'animation', 'asset', 'image/gif'),
            ],
            pagination: { page: 1, pageSize: 100, total: 12, totalPages: 1 },
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

describe('AssetsList file type column', () => {
    beforeEach(() => {
        hasPermission.mockReset();
        hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_ASSET_READ);
    });

    it('shows the concrete extension rather than the broad category', () => {
        renderWithProviders(<AssetsList />);

        // `WEBP`/`MP4` carry information `Image`/`Video` do not — the icon
        // already conveys the category.
        expect(screen.getByText('WEBP')).toBeInTheDocument();
        expect(screen.getByText('MP4')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('CSV')).toBeInTheDocument();
        expect(screen.getByText('MP3')).toBeInTheDocument();
        expect(screen.getByText('WOFF2')).toBeInTheDocument();
        expect(screen.getByText('ZIP')).toBeInTheDocument();
        expect(screen.getByText('TXT')).toBeInTheDocument();

        expect(screen.queryByText('Image')).not.toBeInTheDocument();
        expect(screen.queryByText('Video')).not.toBeInTheDocument();
    });

    it('shows the extension even for files it cannot categorise', () => {
        renderWithProviders(<AssetsList />);
        // The unknown .xyz file is still more usefully labelled than "Other";
        // only the extensionless README falls back to the category label.
        expect(screen.getByText('XYZ')).toBeInTheDocument();
        expect(screen.getAllByText('Other')).toHaveLength(1);
    });

    it('still honours asset_type "css", which an extension alone cannot convey', () => {
        renderWithProviders(<AssetsList />);
        // The CSS category drives the icon; the label shows the extension.
        expect(screen.getByText('CSS')).toBeInTheDocument();
    });

    it('falls back to the category label when the file has no extension', () => {
        renderWithProviders(<AssetsList />);
        // `README` has no extension, so the cell must not render empty.
        expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('labels a file whose name has no extension by its MIME subtype', () => {
        renderWithProviders(<AssetsList />);
        expect(screen.getByText('GIF')).toBeInTheDocument();
    });

    it('renders a thumbnail only for previewable images', () => {
        renderWithProviders(<AssetsList />);
        expect(screen.getByAltText('photo.webp')).toBeInTheDocument();
        expect(screen.queryByAltText('clip.mp4')).not.toBeInTheDocument();
    });
});
