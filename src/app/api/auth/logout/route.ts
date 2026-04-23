/**
 * POST /api/auth/logout — notify Symfony, then clear both httpOnly auth
 * cookies. Preserves sh_lang and sh_csrf so the next page render still has
 * language and CSRF tokens ready.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    AUTH_COOKIE,
    REFRESH_COOKIE,
    SYMFONY_API_PREFIX,
    SYMFONY_INTERNAL_URL,
    clearAuthCookies,
    validateCsrf,
} from '../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const csrfFail = validateCsrf(req);
    if (csrfFail) return csrfFail;

    const jar = await cookies();
    const auth = jar.get(AUTH_COOKIE)?.value;
    const refresh = jar.get(REFRESH_COOKIE)?.value;

    // Best-effort upstream logout — we ignore the outcome so a misbehaving
    // backend cannot trap the user in a logged-in state.
    try {
        await fetch(`${SYMFONY_INTERNAL_URL}${SYMFONY_API_PREFIX}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Client-Type': 'web',
                ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
            },
            body: JSON.stringify({ refresh_token: refresh ?? null }),
            cache: 'no-store',
        });
    } catch {
        // ignore
    }

    const res = NextResponse.json(
        { status: 200, logged_in: false, message: 'Logged out', error: null, meta: {}, data: null },
        { status: 200 }
    );
    clearAuthCookies(res);
    return res;
}
