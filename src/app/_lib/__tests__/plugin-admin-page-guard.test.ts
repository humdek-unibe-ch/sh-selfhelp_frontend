/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../server-fetch', () => ({
    getPluginManifestSSR: vi.fn(),
}));
vi.mock('../admin-guard', () => ({
    requireAdminPermission: vi.fn(),
}));

import { getPluginManifestSSR } from '../server-fetch';
import { requireAdminPermission } from '../admin-guard';
import { findPluginAdminPagePermission, requirePluginAdminPageAccess } from '../plugin-admin-page-guard';

const manifestMock = vi.mocked(getPluginManifestSSR);
const guardMock = vi.mocked(requireAdminPermission);

const manifest = {
    data: {
        plugins: [
            {
                pluginId: 'acme',
                adminPages: [{ slug: 'reports', label: 'Reports', permission: 'acme.reports.read' }],
            },
        ],
    },
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('findPluginAdminPagePermission', () => {
    it('returns the permission the page declares', () => {
        expect(findPluginAdminPagePermission(manifest, 'acme', 'reports')).toBe('acme.reports.read');
    });

    it('returns null for an unknown plugin, an unknown slug or no manifest', () => {
        expect(findPluginAdminPagePermission(manifest, 'other', 'reports')).toBeNull();
        expect(findPluginAdminPagePermission(manifest, 'acme', 'missing')).toBeNull();
        expect(findPluginAdminPagePermission(null, 'acme', 'reports')).toBeNull();
    });
});

describe('requirePluginAdminPageAccess', () => {
    it('asks the admin guard for the permission the page declares', async () => {
        manifestMock.mockResolvedValue(manifest);
        await requirePluginAdminPageAccess('acme', 'reports');
        expect(guardMock).toHaveBeenCalledWith('acme.reports.read');
    });

    it('sends a user with admin.access but not the page permission to no-access', async () => {
        manifestMock.mockResolvedValue(manifest);
        guardMock.mockRejectedValue(new Error('REDIRECT:/no-access'));
        await expect(requirePluginAdminPageAccess('acme', 'reports')).rejects.toThrow('REDIRECT:/no-access');
    });

    it('opens the page for a user who holds the permission', async () => {
        manifestMock.mockResolvedValue(manifest);
        guardMock.mockResolvedValue(undefined);
        await expect(requirePluginAdminPageAccess('acme', 'reports')).resolves.toBeUndefined();
    });

    it('keeps only the admin.access baseline for an unknown slug (host shows not-found)', async () => {
        manifestMock.mockResolvedValue(manifest);
        await requirePluginAdminPageAccess('acme', 'missing');
        expect(guardMock).toHaveBeenCalledWith(undefined);
    });
});
