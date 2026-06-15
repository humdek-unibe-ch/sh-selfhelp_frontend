/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Security regression for the silent-refresh outcome contract.
 *
 * A transient backend outage during silent refresh (network error or 5xx —
 * e.g. the backend container restarting while a plugin install/update applies)
 * must NOT be mistaken for a rejected refresh token. `callSymfonyRefreshToken`
 * returns `unreachable` in that case so the BFF/edge keep the session and let
 * the client retry, and only returns `invalid` when the backend actually
 * reaches a verdict and rejects the token (4xx / 2xx without a token). This is
 * what stops a plugin-install/update restart from logging the operator out.
 */
import { afterEach, describe, it, expect, vi } from 'vitest';
import { callSymfonyRefreshToken } from '../server.config';

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('callSymfonyRefreshToken', () => {
    it('returns ok with rotated tokens on a successful refresh', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            jsonResponse({ data: { access_token: 'new-access', refresh_token: 'new-refresh' } })
        );
        expect(await callSymfonyRefreshToken('old-refresh')).toEqual({
            status: 'ok',
            tokens: { access_token: 'new-access', refresh_token: 'new-refresh' },
        });
    });

    it('keeps the old refresh token when the backend rotates only the access token', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: { access_token: 'new-access' } }));
        expect(await callSymfonyRefreshToken('old-refresh')).toEqual({
            status: 'ok',
            tokens: { access_token: 'new-access', refresh_token: 'old-refresh' },
        });
    });

    it('reports unreachable (not invalid) on a network error so the session is kept', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
        expect(await callSymfonyRefreshToken('r')).toEqual({ status: 'unreachable' });
    });

    it('reports unreachable on a 503 while the backend is restarting, never invalid', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));
        expect(await callSymfonyRefreshToken('r')).toEqual({ status: 'unreachable' });
    });

    it('reports unreachable on a 502 from the edge proxy', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bad gateway', { status: 502 }));
        expect(await callSymfonyRefreshToken('r')).toEqual({ status: 'unreachable' });
    });

    it('reports invalid when the backend reaches a verdict and rejects the token (401)', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ error: 'invalid refresh token' }, 401));
        expect(await callSymfonyRefreshToken('r')).toEqual({ status: 'invalid' });
    });

    it('reports invalid on a 2xx body that carries no access token', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: {} }));
        expect(await callSymfonyRefreshToken('r')).toEqual({ status: 'invalid' });
    });

    it('reports unreachable on an unparseable 2xx body (transient, keep session)', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('not json', { status: 200, headers: { 'content-type': 'application/json' } })
        );
        expect(await callSymfonyRefreshToken('r')).toEqual({ status: 'unreachable' });
    });
});
