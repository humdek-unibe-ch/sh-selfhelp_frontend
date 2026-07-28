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

const asset = (id: number, file_name: string, asset_type: string) => ({
    id,
    file_name,
    asset_type,
    file_path: `uploads/assets/mixed/${file_name}`,
    url: `/cms-api/v1/assets/mixed/${file_name}`,
    folder: 'mixed',
});

vi.mock('../../../../../../hooks/useAssets', () => ({
    useAssets: () => ({
        data: {
            assets: [
                asset(1, 'photo.webp', 'asset'),
                asset(2, 'clip.mp4', 'asset'),
                asset(3, 'theme.css', 'css'),
                asset(4, 'report.pdf', 'asset'),
                asset(5, 'data.csv', 'asset'),
                asset(6, 'track.mp3', 'asset'),
                asset(7, 'brand.woff2', 'asset'),
                asset(8, 'bundle.zip', 'asset'),
                asset(9, 'notes.txt', 'asset'),
                asset(10, 'mystery.xyz', 'asset'),
            ],
            pagination: { page: 1, pageSize: 100, total: 10, totalPages: 1 },
        },
        isLoading: false,
        error: null,
    }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAssetFolders: () => ({ data: { folders: [{ folder: 'mixed', is_open_access: false }] } }),
}));

import { AssetsList } from '../AssetsList';

describe('AssetsList file type column', () => {
    beforeEach(() => {
        hasPermission.mockReset();
        hasPermission.mockImplementation((p: string) => p === PERMISSIONS.ADMIN_ASSET_READ);
    });

    it('labels each file by its extension despite asset_type being "asset"', () => {
        renderWithProviders(<AssetsList />);

        expect(screen.getByText('Image')).toBeInTheDocument();
        expect(screen.getByText('Video')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('Spreadsheet')).toBeInTheDocument();
        expect(screen.getByText('Audio')).toBeInTheDocument();
        expect(screen.getByText('Font')).toBeInTheDocument();
        expect(screen.getByText('Archive')).toBeInTheDocument();
        expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('does not collapse recognised files into "Other"', () => {
        renderWithProviders(<AssetsList />);
        // Only the genuinely unknown .xyz file may be "Other".
        expect(screen.getAllByText('Other')).toHaveLength(1);
    });

    it('still honours asset_type "css", which an extension alone cannot convey', () => {
        renderWithProviders(<AssetsList />);
        expect(screen.getByText('CSS')).toBeInTheDocument();
    });

    it('renders a thumbnail only for previewable images', () => {
        renderWithProviders(<AssetsList />);
        expect(screen.getByAltText('photo.webp')).toBeInTheDocument();
        expect(screen.queryByAltText('clip.mp4')).not.toBeInTheDocument();
    });
});
