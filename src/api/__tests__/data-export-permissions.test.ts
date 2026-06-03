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
 * Permission-matrix guard for the data-export endpoints (canonical Testing
 * Rule 3). The frontend enforces endpoint permissions client-side via the
 * `initializePermissionChecking` request interceptor: it rejects a request
 * before it leaves the browser when the user lacks ALL of the endpoint's
 * declared permissions. We drive that real interceptor — not a reimplementation
 * — against four scopes and assert allow vs. deny for both export endpoints.
 *
 * The export endpoints reuse `admin.data.read`. The matrix below proves a
 * data-reader is allowed and that an admin holding unrelated permissions
 * (page/user read) is denied — the negative cross-scope case the rule requires.
 */

const SCOPES: Record<string, string[]> = {
    'data-reader': [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_DATA_READ],
    // can delete data rows but, hypothetically, not read — proves we check the
    // exact declared permission, not just "any data permission".
    'data-deleter-only': [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_DATA_DELETE],
    // admin of other areas, no data access — negative cross-scope case.
    'page-editor': [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_PAGE_READ, PERMISSIONS.ADMIN_USER_READ],
    guest: [],
};

const EXPECTED_ALLOW: Record<string, boolean> = {
    'data-reader': true,
    'data-deleter-only': false,
    'page-editor': false,
    guest: false,
};

/** Build a client that ONLY runs the permission interceptor and never hits the network. */
function makeGuardedClient(): AxiosInstance {
    const client = axios.create({ baseURL: '/api' });
    initializePermissionChecking(client);
    // Short-circuit AFTER the permission interceptor: if the request reaches the
    // adapter, permission passed. Resolve a dummy 200 so allowed calls succeed.
    client.defaults.adapter = async (config) =>
        ({ data: null, status: 200, statusText: 'OK', headers: {}, config } as never);
    return client;
}

/** Attach permission metadata exactly like permissionAwareApiClient does. */
function withMetadata(permissions: string[]): { _permissionMetadata: { permissions: string[]; endpointKey: string } } {
    return { _permissionMetadata: { permissions, endpointKey: '' } };
}

async function attempt(client: AxiosInstance, url: string, method: 'get' | 'post', permissions: string[]): Promise<boolean> {
    try {
        const cfg = withMetadata(permissions) as unknown as InternalAxiosRequestConfig;
        if (method === 'get') {
            await client.get(url, cfg);
        } else {
            await client.post(url, {}, cfg);
        }
        return true; // reached the adapter → permission allowed
    } catch (err) {
        if (err instanceof Error && err.name === 'PermissionDeniedError') return false;
        throw err; // any other failure is a real test error
    }
}

describe('data export endpoints — permission matrix', () => {
    beforeEach(() => {
        // The interceptor only enforces once the user is initialized.
        permissionManager.setPermissions([]);
    });

    afterEach(() => {
        permissionManager.clearPermissions();
    });

    const singleExportUrl = API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_EXPORT.route('218');
    const singleExportPerms = API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLE_EXPORT.permissions;
    const bulkExportUrl = API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLES_EXPORT_BULK.route as string;
    const bulkExportPerms = API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLES_EXPORT_BULK.permissions;

    it('both export endpoints are gated by admin.data.read', () => {
        expect(singleExportPerms).toEqual([PERMISSIONS.ADMIN_DATA_READ]);
        expect(bulkExportPerms).toEqual([PERMISSIONS.ADMIN_DATA_READ]);
    });

    for (const [scope, perms] of Object.entries(SCOPES)) {
        it(`single-table export: ${scope} is ${EXPECTED_ALLOW[scope] ? 'allowed' : 'denied'}`, async () => {
            const client = makeGuardedClient();
            permissionManager.setPermissions(perms);
            const allowed = await attempt(client, singleExportUrl, 'get', singleExportPerms);
            expect(allowed).toBe(EXPECTED_ALLOW[scope]);
        });

        it(`bulk export: ${scope} is ${EXPECTED_ALLOW[scope] ? 'allowed' : 'denied'}`, async () => {
            const client = makeGuardedClient();
            permissionManager.setPermissions(perms);
            const allowed = await attempt(client, bulkExportUrl, 'post', bulkExportPerms);
            expect(allowed).toBe(EXPECTED_ALLOW[scope]);
        });
    }
});
