/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Security regression for the silent-refresh SINGLE-FLIGHT guard.
 *
 * Symfony rotates the refresh token on every successful refresh (single-use).
 * When the access token expires, a burst of requests can 401 simultaneously —
 * this is exactly what happens while the backend restarts during a plugin
 * install/update/uninstall, amplified by any in-flight polling. Without
 * coalescing, each request POSTs the SAME refresh token: the first rotates it,
 * every other call then sends a now-consumed token, gets a 4xx classified
 * `invalid`, and the BFF/edge wipe a perfectly good session → the operator is
 * logged out.
 *
 * These tests assert the guard collapses the burst into ONE upstream call and
 * replays the rotated result to stragglers, so the session survives.
 */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { callSymfonyRefreshToken, __resetRefreshSingleFlightForTests } from '../server.config';

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

beforeEach(() => {
    __resetRefreshSingleFlightForTests();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('callSymfonyRefreshToken single-flight', () => {
    it('coalesces concurrent refreshes for the same token into ONE upstream call', async () => {
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(jsonResponse({ data: { access_token: 'a1', refresh_token: 'r1' } }));

        const results = await Promise.all(
            Array.from({ length: 8 }, () => callSymfonyRefreshToken('rt0'))
        );

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        for (const result of results) {
            expect(result).toEqual({ status: 'ok', tokens: { access_token: 'a1', refresh_token: 'r1' } });
        }
    });

    it('replays the rotated result to a straggler carrying the old token (no second rotation → no logout)', async () => {
        // Simulate a single-use refresh token: the first refresh succeeds and
        // rotates; any later POST with the SAME (now-consumed) token is rejected.
        let calls = 0;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
            calls += 1;
            return calls === 1
                ? jsonResponse({ data: { access_token: 'a1', refresh_token: 'r1' } })
                : jsonResponse({ error: 'refresh token already used' }, 401);
        });

        const first = await callSymfonyRefreshToken('rt0');
        // A straggler request that 401'd slightly later still carries rt0 (the
        // browser has not yet stored the rotated cookie).
        const straggler = await callSymfonyRefreshToken('rt0');

        expect(first).toEqual({ status: 'ok', tokens: { access_token: 'a1', refresh_token: 'r1' } });
        // The straggler must NOT trigger a second rotation that fails `invalid`.
        expect(straggler).toEqual({ status: 'ok', tokens: { access_token: 'a1', refresh_token: 'r1' } });
        expect(calls).toBe(1);
    });

    it('does a fresh upstream call for a different token / after reset', async () => {
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(jsonResponse({ data: { access_token: 'a1', refresh_token: 'r1' } }));

        await callSymfonyRefreshToken('rt0');
        await callSymfonyRefreshToken('rt-different');
        expect(fetchSpy).toHaveBeenCalledTimes(2);

        __resetRefreshSingleFlightForTests();
        await callSymfonyRefreshToken('rt0');
        expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
});
