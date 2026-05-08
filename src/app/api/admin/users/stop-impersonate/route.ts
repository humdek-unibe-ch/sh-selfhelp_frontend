/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * POST /api/admin/users/stop-impersonate
 *
 * Ends an impersonation session. The Symfony backend blacklists the
 * impersonation JWT so it cannot be replayed; this BFF route additionally
 * deletes the two impersonation cookies (`sh_impersonate` and
 * `sh_impersonate_target_email`) so the very next call from the browser
 * goes back to the original admin's `sh_auth`.
 *
 * Idempotent: if the user is no longer impersonating, the upstream call
 * returns `{stopped: false}` and we still clear the cookies so any stale
 * state on the client is cleaned up.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    IMPERSONATE_COOKIE,
    SYMFONY_API_PREFIX,
    SYMFONY_INTERNAL_URL,
    clearImpersonationCookies,
    validateCsrf,
} from '../../../_lib/proxy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const csrfFail = validateCsrf(req);
    if (csrfFail) return csrfFail;

    const jar = await cookies();
    const impersonationToken = jar.get(IMPERSONATE_COOKIE)?.value;

    let upstreamPayload: unknown = { status: 200, message: 'No active impersonation', data: { stopped: false } };
    let upstreamStatus = 200;

    if (impersonationToken) {
        try {
            const upstream = await fetch(
                `${SYMFONY_INTERNAL_URL}${SYMFONY_API_PREFIX}/admin/users/stop-impersonate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Client-Type': 'web',
                        Authorization: `Bearer ${impersonationToken}`,
                    },
                    body: JSON.stringify({}),
                    cache: 'no-store',
                }
            );
            upstreamStatus = upstream.status;
            upstreamPayload = await upstream.json().catch(() => ({}));
        } catch {
            // Best-effort: even if Symfony is unreachable we still want
            // to clear the cookies so the admin is not stuck.
        }
    }

    const response = NextResponse.json(upstreamPayload, { status: upstreamStatus });
    clearImpersonationCookies(response);
    return response;
}
