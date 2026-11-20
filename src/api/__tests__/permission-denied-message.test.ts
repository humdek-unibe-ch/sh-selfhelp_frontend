/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, afterEach } from 'vitest';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { initializePermissionChecking, permissionManager } from '../permission-wrapper.api';
import { PERMISSIONS } from '../../types/auth/jwt-payload.types';

/**
 * A refused call tells the person what is missing in one sentence. It never
 * lists every permission they hold (that list stays in the debug log).
 */
describe('client permission refusal text', () => {
    afterEach(() => {
        permissionManager.clearPermissions();
    });

    it('names the missing permission and not the held ones', async () => {
        permissionManager.setPermissions([PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_PAGE_READ, PERMISSIONS.ADMIN_ASSET_READ]);
        const client = axios.create({ baseURL: '/api' });
        initializePermissionChecking(client);
        client.defaults.adapter = async (config) => ({ data: null, status: 200, statusText: 'OK', headers: {}, config } as never);

        const config = { _permissionMetadata: { permissions: [PERMISSIONS.ADMIN_PAGE_UPDATE] } } as unknown as InternalAxiosRequestConfig;
        const refusal = await client.post('/admin/pages/1/sections', {}, config).then(() => null, (error: unknown) => error);

        expect(refusal).toBeInstanceOf(Error);
        const message = (refusal as Error).message;
        expect(message).toBe('You do not have permission to do this. It needs admin.page.update.');
        expect(message).not.toContain('admin.asset.read');
        expect(message).not.toContain('User has');
    });
});
