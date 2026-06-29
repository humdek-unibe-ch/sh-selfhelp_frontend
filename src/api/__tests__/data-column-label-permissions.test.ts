/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { initializePermissionChecking, permissionManager } from '../permission-wrapper.api';
import { API_CONFIG } from '../../config/api.config';
import { PERMISSIONS } from '../../types/auth/jwt-payload.types';

/**
 * Permission-matrix guard for the column display-name endpoint (issue #56,
 * canonical Testing Rule 26). Curating a column label changes table-structure
 * metadata, so the PATCH route is gated by the dedicated
 * `admin.data.update_columns` permission. We drive the real client-side
 * permission interceptor against four scopes and assert allow vs. deny.
 */

const SCOPES: Record<string, string[]> = {
    'data-updater': [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_DATA_UPDATE_COLUMNS],
    // can read/delete data, but NOT relabel columns — proves we check the exact
    // declared permission, not just "any data permission".
    'data-reader-only': [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_DATA_READ, PERMISSIONS.ADMIN_DATA_DELETE_COLUMNS],
    'page-editor': [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_PAGE_READ],
    guest: [],
};

const EXPECTED_ALLOW: Record<string, boolean> = {
    'data-updater': true,
    'data-reader-only': false,
    'page-editor': false,
    guest: false,
};

function makeGuardedClient(): AxiosInstance {
    const client = axios.create({ baseURL: '/api' });
    initializePermissionChecking(client);
    client.defaults.adapter = async (config) =>
        ({ data: null, status: 200, statusText: 'OK', headers: {}, config } as never);
    return client;
}

function withMetadata(permissions: string[]): { _permissionMetadata: { permissions: string[] } } {
    return { _permissionMetadata: { permissions } };
}

async function attemptPatch(client: AxiosInstance, url: string, permissions: string[]): Promise<boolean> {
    try {
        const cfg = withMetadata(permissions) as unknown as InternalAxiosRequestConfig;
        await client.patch(url, {}, cfg);
        return true; // reached the adapter → permission allowed
    } catch (err) {
        if (err instanceof Error && err.name === 'PermissionDeniedError') return false;
        throw err;
    }
}

describe('data column display-name endpoint — permission matrix', () => {
    beforeEach(() => {
        permissionManager.setPermissions([]);
    });

    afterEach(() => {
        permissionManager.clearPermissions();
    });

    const url = API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_COLUMN_DISPLAY_NAME_PATCH.route('218');
    const perms = API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_COLUMN_DISPLAY_NAME_PATCH.permissions;

    it('is gated by admin.data.update_columns', () => {
        expect(perms).toEqual([PERMISSIONS.ADMIN_DATA_UPDATE_COLUMNS]);
    });

    for (const [scope, scopePerms] of Object.entries(SCOPES)) {
        it(`relabel column: ${scope} is ${EXPECTED_ALLOW[scope] ? 'allowed' : 'denied'}`, async () => {
            const client = makeGuardedClient();
            permissionManager.setPermissions(scopePerms);
            const allowed = await attemptPatch(client, url, perms);
            expect(allowed).toBe(EXPECTED_ALLOW[scope]);
        });
    }
});
