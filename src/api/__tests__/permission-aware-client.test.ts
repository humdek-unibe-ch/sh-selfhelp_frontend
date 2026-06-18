/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Tests for the permission-aware client's argument handling (audit Findings 2 &
 * 3). The trailing-config detection + URL building used to be copy-pasted into
 * all five verbs; it now lives in one helper. These tests pin that contract:
 *
 *  - static and dynamic routes resolve correctly,
 *  - a trailing AxiosRequestConfig is detected and merged (incl. DELETE `data`),
 *  - a primitive route param is never mistaken for config,
 *  - the attached metadata carries `permissions` and NO `endpointKey` (the
 *    always-empty placeholder that Finding 3 removed).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { get, post, del } = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    del: vi.fn(),
}));

vi.mock('../base.api', () => ({
    apiClient: {
        get,
        post,
        put: vi.fn(),
        patch: vi.fn(),
        delete: del,
    },
}));

import { permissionAwareApiClient } from '../permission-aware-client.api';

/** Read the config argument an apiClient verb was called with. */
function configArg(call: unknown[]): { _permissionMetadata?: Record<string, unknown> } & Record<string, unknown> {
    return (call.at(-1) ?? {}) as { _permissionMetadata?: Record<string, unknown> } & Record<string, unknown>;
}

beforeEach(() => {
    get.mockReset().mockResolvedValue({ data: null });
    post.mockReset().mockResolvedValue({ data: null });
    del.mockReset().mockResolvedValue({ data: null });
});

describe('permissionAwareApiClient argument handling', () => {
    it('attaches permissions metadata with no endpointKey for a static GET', async () => {
        await permissionAwareApiClient.get({ route: '/admin/users', permissions: ['admin.user.read'] });

        expect(get).toHaveBeenCalledTimes(1);
        expect(get.mock.calls[0][0]).toBe('/admin/users');
        const cfg = configArg(get.mock.calls[0]);
        expect(cfg._permissionMetadata).toEqual({ permissions: ['admin.user.read'] });
        expect(cfg._permissionMetadata).not.toHaveProperty('endpointKey');
    });

    it('resolves a dynamic route from a primitive param without treating it as config', async () => {
        await permissionAwareApiClient.get({ route: (id: number) => `/admin/users/${id}`, permissions: [] }, 7);

        expect(get.mock.calls[0][0]).toBe('/admin/users/7');
        expect(configArg(get.mock.calls[0])._permissionMetadata).toEqual({ permissions: [] });
    });

    it('detects and merges a trailing AxiosRequestConfig', async () => {
        await permissionAwareApiClient.get(
            { route: (id: number) => `/x/${id}`, permissions: [] },
            7,
            { params: { q: 1 } },
        );

        expect(get.mock.calls[0][0]).toBe('/x/7');
        const cfg = configArg(get.mock.calls[0]);
        expect(cfg.params).toEqual({ q: 1 });
        expect(cfg._permissionMetadata).toEqual({ permissions: [] });
    });

    it('passes the body through for POST and still attaches metadata', async () => {
        await permissionAwareApiClient.post({ route: '/x', permissions: [] }, { name: 'a' });

        expect(post.mock.calls[0][0]).toBe('/x');
        expect(post.mock.calls[0][1]).toEqual({ name: 'a' });
        expect(configArg(post.mock.calls[0])._permissionMetadata).toEqual({ permissions: [] });
    });

    it('treats a DELETE `{ data }` argument as config (body), not a route param', async () => {
        await permissionAwareApiClient.delete({ route: '/x', permissions: [] }, { data: { ids: [1] } });

        expect(del.mock.calls[0][0]).toBe('/x');
        const cfg = configArg(del.mock.calls[0]);
        expect(cfg.data).toEqual({ ids: [1] });
        expect(cfg._permissionMetadata).toEqual({ permissions: [] });
    });
});
