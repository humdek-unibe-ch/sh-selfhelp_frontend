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

import { GET } from '../../[...path]/route';

/**
 * Conditional requests through the BFF.
 *
 * The backend serves an asset with `ETag` / `Last-Modified` and answers a
 * revalidation with `304 Not Modified`, so image-heavy pages do not download
 * the bytes again. The browser talks to `/api/*`, so the proxy sits in the
 * middle: if it dropped the validators on the way up, or turned the 304 into an
 * error or a full body on the way down, every asset would be downloaded in full
 * on every page view.
 *
 * It must also relay the headers that keep an ACL-scoped file private
 * (`Cache-Control: private`) and sandboxed (`Content-Security-Policy`), or a
 * shared cache could hand one user's file to another.
 */
const fetchMock = vi.fn<typeof fetch>();

function assetRequest(headers: Record<string, string> = {}): NextRequest {
    return new NextRequest('http://localhost/api/assets/3f2b1c9e-0000-4000-8000-000000000001', { headers });
}

function callGet(request: NextRequest): Promise<Response> {
    return GET(request, { params: Promise.resolve({ path: ['assets', '3f2b1c9e-0000-4000-8000-000000000001'] }) });
}

function upstreamRequestHeaders(): Headers {
    const init = fetchMock.mock.calls[0]?.[1];
    return new Headers(init?.headers);
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('BFF proxy: conditional GET', () => {
    it('forwards the validators the browser sends', async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 304, headers: { etag: '"v1"' } }));

        await callGet(assetRequest({
            'if-none-match': '"v1"',
            'if-modified-since': 'Tue, 10 Nov 2026 09:00:00 GMT',
        }));

        const sent = upstreamRequestHeaders();
        expect(sent.get('if-none-match')).toBe('"v1"');
        expect(sent.get('if-modified-since')).toBe('Tue, 10 Nov 2026 09:00:00 GMT');
        expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('GET');
    });

    it('relays 304 Not Modified as an empty 304 that keeps the validators', async () => {
        fetchMock.mockResolvedValue(new Response(null, {
            status: 304,
            headers: {
                etag: '"v1"',
                'last-modified': 'Tue, 10 Nov 2026 09:00:00 GMT',
                'cache-control': 'private',
            },
        }));

        const response = await callGet(assetRequest({ 'if-none-match': '"v1"' }));

        expect(response.status).toBe(304);
        expect(response.body).toBeNull();
        expect(response.headers.get('etag')).toBe('"v1"');
        expect(response.headers.get('last-modified')).toBe('Tue, 10 Nov 2026 09:00:00 GMT');
        expect(response.headers.get('cache-control')).toBe('private');
    });

    it('relays the file bytes untouched, with the headers that keep it private and sandboxed', async () => {
        const bytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
        fetchMock.mockResolvedValue(new Response(bytes, {
            status: 200,
            headers: {
                'content-type': 'image/svg+xml',
                etag: '"v2"',
                'last-modified': 'Tue, 10 Nov 2026 09:00:00 GMT',
                'cache-control': 'private',
                'x-content-type-options': 'nosniff',
                'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
                'content-disposition': 'inline; filename="logo.svg"',
            },
        }));

        const response = await callGet(assetRequest());

        expect(response.status).toBe(200);
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
        expect(response.headers.get('etag')).toBe('"v2"');
        expect(response.headers.get('cache-control')).toBe('private');
        expect(response.headers.get('x-content-type-options')).toBe('nosniff');
        expect(response.headers.get('content-security-policy')).toContain('sandbox');
        expect(response.headers.get('content-disposition')).toBe('inline; filename="logo.svg"');
        expect(response.headers.get('content-type')).toBe('image/svg+xml');
    });
});
