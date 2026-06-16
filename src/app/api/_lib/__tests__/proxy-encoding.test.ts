/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression tests for BFF proxy content-coding handling.
 *
 * Production regression: the catch-all proxy forwarded the browser's
 * `Accept-Encoding` (Chrome includes `zstd`) to Symfony, whose Caddy then
 * compressed large responses with zstd — a coding undici does NOT decode.
 * Mutation handlers read `.text()` on raw zstd bytes, JSON parsing failed,
 * and the browser received binary garbage: creates (users/pages) succeeded
 * server-side but the UI showed nothing, and the user's manual retry
 * surfaced a confusing 409 "already exists".
 *
 * Contract under test:
 *   1. `bufferRequest` must NOT forward the client's `Accept-Encoding`;
 *      undici negotiates codings it can decode (gzip/br) itself.
 *   2. `cloneUpstreamResponse` must NOT relay `Content-Encoding`, because
 *      the body it streams is the already-decoded one.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { bufferRequest, cloneUpstreamResponse } from '../proxy';

describe('bufferRequest', () => {
    it('drops the browser Accept-Encoding so undici negotiates decodable codings', async () => {
        const req = new NextRequest('http://localhost/api/admin/pages', {
            method: 'POST',
            headers: {
                'accept-encoding': 'gzip, deflate, br, zstd',
                'content-type': 'application/json',
                'x-custom': 'kept',
            },
            body: JSON.stringify({ keyword: 'qa-page' }),
        });

        const buffered = await bufferRequest(req);

        expect(buffered.headers.get('accept-encoding')).toBeNull();
        // Unrelated headers still pass through.
        expect(buffered.headers.get('x-custom')).toBe('kept');
        expect(buffered.headers.get('content-type')).toContain('application/json');
        // The proxy pins its own JSON accept header.
        expect(buffered.headers.get('accept')).toBe('application/json');
        expect(buffered.method).toBe('POST');
        expect(buffered.body).not.toBeNull();
    });
});

describe('cloneUpstreamResponse', () => {
    it('does not relay Content-Encoding for the decoded body it streams', () => {
        const upstream = new Response('{"status":200}', {
            status: 200,
            headers: {
                'content-type': 'application/json',
                // undici leaves this header on the response even after it
                // transparently gunzips the body.
                'content-encoding': 'gzip',
                'content-length': '999',
                'x-upstream': 'kept',
            },
        });

        const res = cloneUpstreamResponse(upstream);

        expect(res.status).toBe(200);
        expect(res.headers.get('content-encoding')).toBeNull();
        expect(res.headers.get('content-length')).toBeNull();
        expect(res.headers.get('content-type')).toBe('application/json');
        expect(res.headers.get('x-upstream')).toBe('kept');
    });
});
