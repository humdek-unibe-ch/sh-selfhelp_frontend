/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({
    cookies: async () => ({ get: () => undefined }),
}));

import { GET, POST } from '../../[...path]/route';
import { CSRF_COOKIE } from '../../../../config/cookie-names';

/**
 * The JSON branch of the BFF proxy builds a new response, so any reply header it does not copy is
 * lost on the way to the browser. Two headers must survive (P4-A3):
 *
 * - `X-Acl-Stamp` (C5): the client compares it with `acl_stamp` of its user data.
 * - `X-Page-Version` (C8): the draft version a page write answered with.
 *
 * Both are per caller and must come through for a read and for a write, an error included.
 */
const fetchMock = vi.fn<typeof fetch>();

function upstreamJson(body: unknown, init: ResponseInit = {}): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        ...init,
        headers: { 'content-type': 'application/json', ...(init.headers as Record<string, string> | undefined) },
    });
}

function get(path: string[]): Promise<Response> {
    return GET(new NextRequest(`http://localhost/api/${path.join('/')}`), { params: Promise.resolve({ path }) });
}

function post(path: string[], body: unknown): Promise<Response> {
    return POST(
        new NextRequest(`http://localhost/api/${path.join('/')}`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'content-type': 'application/json', cookie: `${CSRF_COOKIE}=token-1`, 'x-csrf-token': 'token-1' },
        }),
        { params: Promise.resolve({ path }) },
    );
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF proxy: reply headers of the JSON branch (P4-A3)', () => {
    it('passes X-Acl-Stamp on with a read', async () => {
        fetchMock.mockResolvedValue(upstreamJson({ status: 200, data: {} }, { headers: { 'x-acl-stamp': 'abcdef0123456789' } }));

        const response = await get(['pages', 'resolve']);

        expect(response.status).toBe(200);
        expect(response.headers.get('x-acl-stamp')).toBe('abcdef0123456789');
    });

    it('passes X-Page-Version on with a write', async () => {
        fetchMock.mockResolvedValue(upstreamJson({ status: 200, data: {} }, { headers: { 'x-page-version': '17' } }));

        const response = await post(['admin', 'pages', '4', 'sections'], { a: 1 });

        expect(response.headers.get('x-page-version')).toBe('17');
    });

    it('passes both on with an error answer', async () => {
        fetchMock.mockResolvedValue(
            upstreamJson({ status: 409, error: 'stale' }, { status: 409, headers: { 'x-acl-stamp': 'abcdef0123456789', 'x-page-version': '18' } }),
        );

        const response = await post(['admin', 'pages', '4', 'sections'], { a: 1 });

        expect(response.status).toBe(409);
        expect(response.headers.get('x-acl-stamp')).toBe('abcdef0123456789');
        expect(response.headers.get('x-page-version')).toBe('18');
    });

    it('adds nothing when the upstream did not send them (a guest, an older core)', async () => {
        fetchMock.mockResolvedValue(upstreamJson({ status: 200, data: {} }));

        const response = await get(['pages', 'resolve']);

        expect(response.headers.has('x-acl-stamp')).toBe(false);
        expect(response.headers.has('x-page-version')).toBe(false);
    });

    it('passes them on for a body that is not JSON-parsable too', async () => {
        fetchMock.mockResolvedValue(
            new Response('not json', { status: 200, headers: { 'content-type': 'application/json', 'x-acl-stamp': 'abcdef0123456789' } }),
        );

        const response = await get(['pages', 'resolve']);

        expect(response.headers.get('x-acl-stamp')).toBe('abcdef0123456789');
    });
});
