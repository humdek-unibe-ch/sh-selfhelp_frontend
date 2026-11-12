/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * F79: the dedicated login route must forward X-Forwarded-For the same way
 * the catch-all proxy does, so the backend's per-address auth throttle counts
 * web logins.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const validateCsrf = vi.fn(() => null);
const setAuthCookies = vi.fn();
const stripTokensFromBody = vi.fn((payload: unknown) => ({
    body: payload,
    tokens: null,
}));

vi.mock('../../../_lib/proxy', async () => {
    const actual = await vi.importActual('../../../_lib/proxy') as Record<string, unknown>;
    return {
        ...actual,
        validateCsrf,
        setAuthCookies,
        stripTokensFromBody,
        SYMFONY_INTERNAL_URL: 'http://symfony.test',
        SYMFONY_API_PREFIX: '/cms-api/v1',
    };
});

describe('POST /api/auth/login X-Forwarded-For', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        validateCsrf.mockReturnValue(null);
        stripTokensFromBody.mockImplementation((payload: unknown) => ({
            body: payload,
            tokens: null,
        }));
        vi.stubGlobal(
            'fetch',
            vi.fn(async () =>
                new Response(JSON.stringify({ status: 200, data: {} }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                }),
            ),
        );
    });

    it('forwards X-Forwarded-For: 203.0.113.7 to the upstream fetch when the request carries it', async () => {
        const { POST } = await import('../route');
        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '203.0.113.7',
                'x-csrf-token': 'test',
            },
            body: JSON.stringify({ user_name: 'a', password: 'b' }),
        });

        await POST(req);

        expect(fetch).toHaveBeenCalledTimes(1);
        const [, init] = vi.mocked(fetch).mock.calls[0]!;
        const headers = new Headers(init?.headers);
        expect(headers.get('x-forwarded-for')).toBe('203.0.113.7');
    });

    it('sends no X-Forwarded-For when the request has none (same as the catch-all)', async () => {
        const { POST } = await import('../route');
        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-csrf-token': 'test',
            },
            body: JSON.stringify({ user_name: 'a', password: 'b' }),
        });

        await POST(req);

        expect(fetch).toHaveBeenCalledTimes(1);
        const [, init] = vi.mocked(fetch).mock.calls[0]!;
        const headers = new Headers(init?.headers);
        expect(headers.get('x-forwarded-for')).toBeNull();
    });
});
