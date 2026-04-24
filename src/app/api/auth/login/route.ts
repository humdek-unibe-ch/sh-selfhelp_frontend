/**
 * POST /api/auth/login — forwards credentials to Symfony, sets the two
 * httpOnly auth cookies on success, and returns the user object without
 * tokens. The browser never sees the access or refresh tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    SYMFONY_API_PREFIX,
    SYMFONY_INTERNAL_URL,
    setAuthCookies,
    stripTokensFromBody,
    validateCsrf,
} from '../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const csrfFail = validateCsrf(req);
    if (csrfFail) return csrfFail;

    const body = await req.text();

    const upstream = await fetch(`${SYMFONY_INTERNAL_URL}${SYMFONY_API_PREFIX}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': req.headers.get('content-type') || 'application/json',
            'Accept': 'application/json',
            'X-Client-Type': 'web',
        },
        body,
        cache: 'no-store',
    });

    const payload = await upstream.json().catch(() => ({}));
    const { body: cleanBody, tokens } = stripTokensFromBody(payload);

    const response = NextResponse.json(cleanBody, { status: upstream.status });

    if (upstream.ok && tokens) {
        setAuthCookies(response, tokens);
    }

    return response;
}
