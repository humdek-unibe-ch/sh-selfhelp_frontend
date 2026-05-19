/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * POST /api/admin/users/{userId}/impersonate
 *
 * Dedicated BFF route for starting an impersonation session. The catch-all
 * `[...path]/route.ts` would also match this URL, but we handle it
 * explicitly so we can:
 *
 *   1. Strip the `impersonation_token` from the Symfony JSON envelope
 *      and hoist it into an **httpOnly** cookie. The browser never sees
 *      the JWT — XSS cannot exfiltrate it.
 *   2. Persist a parallel non-httpOnly hint cookie carrying just the
 *      target email, so the React banner can render without an extra
 *      API call.
 *
 * Without this route, the only way the frontend could keep the
 * impersonation token would be `document.cookie = ...`, which makes the
 * token readable from any JavaScript on the page (XSS-vulnerable). This
 * file is the architectural fix for that — the token is locked away the
 * exact same way the regular `sh_auth` JWT is.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    AUTH_COOKIE,
    SYMFONY_API_PREFIX,
    SYMFONY_INTERNAL_URL,
    setImpersonationCookies,
    stripImpersonationFromBody,
    validateCsrf,
} from '../../../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
    const csrfFail = validateCsrf(req);
    if (csrfFail) return csrfFail;

    const { userId } = await context.params;

    // Always run impersonation start under the *admin* token. The
    // catch-all proxy would happily forward an existing impersonation
    // token here, but starting a new impersonation while already
    // impersonating must come from the original admin's authority —
    // the backend also blocks chained impersonation as an extra layer.
    const jar = await cookies();
    const adminToken = jar.get(AUTH_COOKIE)?.value;

    const upstream = await fetch(
        `${SYMFONY_INTERNAL_URL}${SYMFONY_API_PREFIX}/admin/users/${encodeURIComponent(userId)}/impersonate`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Client-Type': 'web',
                ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
            },
            body: JSON.stringify({}),
            cache: 'no-store',
        }
    );

    const payload = await upstream.json().catch(() => ({}));
    const { body: cleanBody, impersonation } = stripImpersonationFromBody(payload);

    const response = NextResponse.json(cleanBody, { status: upstream.status });

    if (upstream.ok && impersonation) {
        setImpersonationCookies(
            response,
            impersonation.token,
            impersonation.targetEmail,
            impersonation.expiresIn
        );
    }

    return response;
}
