/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Protected BFF mint route for the CMS mobile preview.
 *
 *   POST /api/mobile-preview/session  ->  Symfony POST /cms-api/v1/admin/mobile-preview/session
 *
 * The admin page-editor preview panel calls this to mint a SHORT-LIVED,
 * single-use preview code. We forward the call to the PRIVATE backend with the
 * admin's server-side JWT (read from the httpOnly `sh_auth` cookie, never the
 * browser), exactly like the catch-all proxy — so:
 *
 *   - the admin JWT never reaches the browser / the preview iframe,
 *   - the backend still enforces the `admin.mobile_preview.create` permission
 *     (this route is just the choke point; it grants nothing on its own),
 *   - CSRF double-submit is validated (it is a state-changing POST),
 *   - a silently-expired access token is refreshed + the call retried once.
 *
 * Only the resulting `{ code, expires_at }` envelope is returned to the panel,
 * which puts the one-time code in the preview iframe URL. There is deliberately
 * NO public `/cms-api` rewrite in `next.config.mjs`: minting always goes through
 * this authenticated BFF hop.
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
    buildUpstreamUrl,
    bufferRequest,
    clearAuthCookies,
    cloneUpstreamResponse,
    forwardBufferedToSymfony,
    refreshInternal,
    setAuthCookies,
    validateCsrf,
    type BufferedRequest,
} from '../../_lib/proxy';

export const dynamic = 'force-dynamic';

/** Upstream admin mint endpoint (relative to {@link buildUpstreamUrl}'s prefix). */
const MINT_UPSTREAM_PATH = 'admin/mobile-preview/session';

async function handle(req: NextRequest): Promise<NextResponse> {
    const csrfFail = validateCsrf(req);
    if (csrfFail) return csrfFail;

    const upstreamUrl = buildUpstreamUrl(MINT_UPSTREAM_PATH);

    // Buffer the body once so a post-refresh retry can replay it verbatim.
    const buffered: BufferedRequest = await bufferRequest(req);

    let upstream = await forwardBufferedToSymfony(buffered, upstreamUrl);

    if (upstream.status === 401) {
        const refreshed = await refreshInternal();
        if (refreshed.status === 'ok') {
            upstream = await forwardBufferedToSymfony(buffered, upstreamUrl, refreshed.tokens.access_token);
            const res = cloneUpstreamResponse(upstream);
            // Persist the rotated admin token so the next call uses it.
            setAuthCookies(res, refreshed.tokens);
            return res;
        }
        if (refreshed.status === 'unreachable') {
            // Transient backend outage (e.g. mid restart): never destroy the
            // session — let the panel retry.
            return NextResponse.json(
                {
                    error: 'backend_unavailable',
                    logged_in: true,
                    status: 503,
                    message: 'The server is briefly unavailable (it may be restarting). Please retry.',
                    meta: {},
                    data: null,
                },
                { status: 503 },
            );
        }
        // Genuine logout: clear cookies and surface the original 401.
        const response = cloneUpstreamResponse(upstream);
        clearAuthCookies(response);
        return response;
    }

    // The mint envelope carries no token rotation, so a plain clone is enough.
    return cloneUpstreamResponse(upstream);
}

export const POST = handle;
