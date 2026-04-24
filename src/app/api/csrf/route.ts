/**
 * `GET /api/csrf` — CSRF token bootstrap endpoint.
 *
 * The browser flow acquires `sh_csrf` automatically through the Next.js
 * proxy on the first page visit, so the UI never needs to call this. It
 * exists for two scenarios:
 *
 *   1. **API-only clients** (curl, Postman, integration tests) that never
 *      touch a rendered page and therefore never pass through the proxy.
 *      They can `GET /api/csrf`, read the returned token, then include it
 *      as both the `sh_csrf` cookie (auto-stored by their HTTP client) and
 *      the `X-CSRF-Token` header on subsequent mutations.
 *
 *   2. **Recovery**: a browser whose cookie jar was cleared mid-session
 *      can hit this without a full navigation to re-seed the token.
 *
 * Always returns 200 with `{ csrf_token: "..." }`. Never exposes the
 * internals of the double-submit scheme beyond what the header already
 * does, so it's safe to call from any origin we already trust.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRF_COOKIE, LONG_LIVED_COOKIE_MAX_AGE, randomHexToken } from '../../../config/server.config';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const existing = req.cookies.get(CSRF_COOKIE)?.value;
    const token = existing || randomHexToken();

    const response = NextResponse.json({
        csrf_token: token,
        cookie_name: CSRF_COOKIE,
        header_name: 'X-CSRF-Token',
    });

    if (!existing) {
        response.cookies.set(CSRF_COOKIE, token, {
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: LONG_LIVED_COOKIE_MAX_AGE,
        });
    }

    return response;
}
