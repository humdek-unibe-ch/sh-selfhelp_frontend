/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Live sync C8 and C9 in the HTTP client: every draft write of a page names the version the
 * editor holds (`X-Page-Version`), takes the new one from the reply, and a `409` tells the
 * editor (P6-A1, P6-A2, P6-A6).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { permissionAwareApiClient } from '../base.api';
import {
    draftWritePageId,
    getPageDraftVersion,
    registerPageDraftVersionLoader,
    rememberPageDraftVersion,
    resetPageDraftVersionsForTests,
} from '../../utils/page-draft-version.utils';
import {
    isStaleConflictHeld,
    resetPageEditConflictsForTests,
    subscribePageEditConflict,
    type TPageEditConflict,
} from '../../utils/page-edit-conflict.utils';

interface IScriptedReply {
    status?: number;
    data?: unknown;
    headers?: Record<string, string>;
}

/** An adapter that records what was sent and answers from a script. */
function scriptedAdapter(script: IScriptedReply[]) {
    const sent: { method: string; url: string; version: string | undefined }[] = [];
    const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
        const reply = script.shift() ?? { status: 200, data: {} };
        const headers = config.headers as { get?: (name: string) => unknown };
        const version = headers.get?.('X-Page-Version');
        sent.push({
            method: String(config.method),
            url: String(config.url),
            version: version === undefined || version === null ? undefined : String(version),
        });
        const status = reply.status ?? 200;
        const response: AxiosResponse = {
            data: reply.data ?? {},
            status,
            statusText: String(status),
            headers: reply.headers ?? {},
            config,
        };
        if (status >= 400) {
            throw new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response);
        }
        return response;
    };
    return { adapter, sent };
}

/** One request through the app's client; the route is given as a plain path so the scripted adapter answers it. */
function call(
    method: 'get' | 'delete' | 'put' | 'post',
    url: string,
    adapter: AxiosAdapter,
    body?: unknown,
): Promise<unknown> {
    const endpoint = { route: url, permissions: [] };
    const config = { headers: {}, adapter };
    if (method === 'get' || method === 'delete') {
        return permissionAwareApiClient[method](endpoint, config);
    }
    return permissionAwareApiClient[method](endpoint, body, config);
}

beforeEach(() => {
    resetPageDraftVersionsForTests();
    resetPageEditConflictsForTests();
});

afterEach(() => {
    resetPageDraftVersionsForTests();
    resetPageEditConflictsForTests();
});

describe('which requests are draft writes', () => {
    it('writes under /admin/pages/<id>, but not reads, the lock, import, export or other areas', () => {
        expect(draftWritePageId('put', '/admin/pages/12')).toBe(12);
        expect(draftWritePageId('POST', '/admin/pages/12/sections/5')).toBe(12);
        expect(draftWritePageId('delete', '/admin/pages/12/versions/3')).toBe(12);
        expect(draftWritePageId('post', '/admin/pages/12/publish')).toBe(12);

        expect(draftWritePageId('get', '/admin/pages/12')).toBeNull();
        expect(draftWritePageId('post', '/admin/pages/12/lock')).toBeNull();
        expect(draftWritePageId('delete', '/admin/pages/12/lock')).toBeNull();
        expect(draftWritePageId('post', '/admin/pages/12/lock/take-over')).toBeNull();
        expect(draftWritePageId('post', '/admin/pages/import')).toBeNull();
        expect(draftWritePageId('post', '/admin/pages/export')).toBeNull();
        expect(draftWritePageId('put', '/admin/groups/12')).toBeNull();
    });
});

describe('X-Page-Version on draft writes (C8, P6-A1)', () => {
    it('sends the held version and holds the one from the reply for the next write', async () => {
        rememberPageDraftVersion(12, 3);
        const { adapter, sent } = scriptedAdapter([{ headers: { 'x-page-version': '4' } }, { headers: { 'x-page-version': '5' } }]);

        await call('put', '/admin/pages/12', adapter, { a: 1 });
        expect(getPageDraftVersion(12)).toBe(4);
        await call('post', '/admin/pages/12/publish', adapter, {});

        expect(sent.map((request) => request.version)).toEqual(['3', '4']);
        expect(getPageDraftVersion(12)).toBe(5);
    });

    it('keeps the versions of different pages apart', async () => {
        rememberPageDraftVersion(12, 3);
        rememberPageDraftVersion(13, 8);
        const { adapter, sent } = scriptedAdapter([{}, {}]);

        await call('put', '/admin/pages/13', adapter, {});
        await call('put', '/admin/pages/12', adapter, {});

        expect(sent.map((request) => request.version)).toEqual(['8', '3']);
    });

    it('does not send a version with reads, the lock routes or other writes', async () => {
        rememberPageDraftVersion(12, 3);
        const { adapter, sent } = scriptedAdapter([{}, {}, {}, {}]);

        await call('get', '/admin/pages/12', adapter);
        await call('post', '/admin/pages/12/lock', adapter, {});
        await call('delete', '/admin/pages/12/lock', adapter);
        await call('put', '/admin/groups/12', adapter, {});

        expect(sent.map((request) => request.version)).toEqual([undefined, undefined, undefined, undefined]);
    });

    it('takes a newer version from a read, never an older one', async () => {
        rememberPageDraftVersion(12, 7);
        const { adapter } = scriptedAdapter([{ headers: { 'x-page-version': '9' } }, { headers: { 'x-page-version': '2' } }]);

        await call('get', '/admin/pages/12', adapter);
        expect(getPageDraftVersion(12)).toBe(9);
        await call('get', '/admin/pages/12', adapter);
        expect(getPageDraftVersion(12)).toBe(9);
    });

    it('reads the draft first when the version is not known yet (a publish from a list)', async () => {
        const loader = vi.fn(async (pageId: number) => {
            rememberPageDraftVersion(pageId, 11);
        });
        registerPageDraftVersionLoader(loader);
        const { adapter, sent } = scriptedAdapter([{ headers: { 'x-page-version': '12' } }]);

        await call('post', '/admin/pages/12/publish', adapter, {});

        expect(loader).toHaveBeenCalledWith(12);
        expect(sent[0]?.version).toBe('11');
        expect(getPageDraftVersion(12)).toBe(12);
    });

    it('sends the writes of one page one after the other, each with the version of the one before', async () => {
        rememberPageDraftVersion(12, 3);
        const { adapter, sent } = scriptedAdapter([
            { headers: { 'x-page-version': '4' } },
            { headers: { 'x-page-version': '5' } },
            { headers: { 'x-page-version': '6' } },
        ]);

        await Promise.all([
            call('put', '/admin/pages/12', adapter, { n: 1 }),
            call('put', '/admin/pages/12/sections/5', adapter, { n: 2 }),
            call('post', '/admin/pages/12/publish', adapter, {}),
        ]);

        expect(sent.map((request) => request.version)).toEqual(['3', '4', '5']);
    });

    it('lets the next write go after a failed one', async () => {
        rememberPageDraftVersion(12, 3);
        const { adapter, sent } = scriptedAdapter([{ status: 400, data: { error: 'bad' } }, { headers: { 'x-page-version': '4' } }]);

        const first = call('put', '/admin/pages/12', adapter, {});
        const second = call('put', '/admin/pages/12', adapter, {});

        await expect(first).rejects.toBeInstanceOf(AxiosError);
        await second;
        expect(sent.map((request) => request.version)).toEqual(['3', '3']);
        expect(getPageDraftVersion(12)).toBe(4);
    });
});

describe('409 stale_page_version (C8, P6-A2)', () => {
    it('tells the editor, holds the current version of the server and keeps the inspectors\' values', async () => {
        rememberPageDraftVersion(12, 3);
        const conflicts: TPageEditConflict[] = [];
        subscribePageEditConflict((conflict) => conflicts.push(conflict));
        const { adapter, sent } = scriptedAdapter([
            { status: 409, data: { status: 409, error: 'stale_page_version', data: { page_id: 12, current_version: 6 } } },
            { headers: { 'x-page-version': '7' } },
        ]);

        await expect(call('put', '/admin/pages/12', adapter, {})).rejects.toBeInstanceOf(AxiosError);

        expect(conflicts).toEqual([{ kind: 'stale', pageId: 12, currentVersion: 6 }]);
        expect(getPageDraftVersion(12)).toBe(6);
        expect(isStaleConflictHeld(12)).toBe(true);
        expect(isStaleConflictHeld(13)).toBe(false);

        // The person saves their values again on top: the version is now the current one.
        await call('put', '/admin/pages/12', adapter, {});
        expect(sent.map((request) => request.version)).toEqual(['3', '6']);
        expect(isStaleConflictHeld(12)).toBe(false);
    });
});

describe('409 page_locked (C9, P6-A6)', () => {
    it('tells the editor with the lock status of the answer, for a write of any kind', async () => {
        rememberPageDraftVersion(12, 3);
        const conflicts: TPageEditConflict[] = [];
        subscribePageEditConflict((conflict) => conflicts.push(conflict));
        const status = {
            page_id: 12,
            held: true,
            mine: false,
            holder: { id: 4, name: 'Ada Lovelace' },
            expires_at: '2026-11-20T10:02:00Z',
            idle_expires_at: '2026-11-20T10:15:00Z',
        };
        const { adapter } = scriptedAdapter([{ status: 409, data: { status: 409, error: 'page_locked', data: status } }]);

        await expect(call('post', '/admin/pages/12/publish', adapter, {})).rejects.toBeInstanceOf(AxiosError);

        expect(conflicts).toEqual([{ kind: 'locked', pageId: 12, status }]);
        expect(isStaleConflictHeld(12)).toBe(false);
    });

    it('stays silent for other 409 answers', async () => {
        const conflicts: TPageEditConflict[] = [];
        subscribePageEditConflict((conflict) => conflicts.push(conflict));
        const { adapter } = scriptedAdapter([{ status: 409, data: { status: 409, error: 'keyword already exists' } }]);

        await expect(call('put', '/admin/pages/12', adapter, {})).rejects.toBeInstanceOf(AxiosError);

        expect(conflicts).toEqual([]);
    });
});
