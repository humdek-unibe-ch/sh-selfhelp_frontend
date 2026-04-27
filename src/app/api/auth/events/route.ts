/**
 * BFF Mercure subscription proxy.
 *
 * Bridges the browser to a Mercure hub for real-time `acl-changed` push:
 *
 *   browser EventSource → /api/auth/events → Mercure hub
 *                          (this BFF route)   (held by the hub, not PHP)
 *
 * The browser cannot talk to the hub directly in a portable way — Mercure
 * authenticates subscribers with a JWT (Authorization header or
 * `mercureAuthorization` cookie), and `EventSource` cannot set custom
 * headers, so cross-origin (localhost:3000 → localhost:3001) subscriptions
 * would need a `SameSite=None; Secure` cookie which fails on http://
 * localhost. Proxying through this same-origin route sidesteps the entire
 * cross-origin / cookie-domain mess and keeps the wire contract for
 * `useAclEventStream` identical to the previous SSE implementation.
 *
 * ## Flow
 *
 * 1. Read the user's JWT from the httpOnly `sh_auth` cookie.
 * 2. Call Symfony's `GET /cms-api/v1/auth/events` to get the Mercure
 *    discovery payload `{ hubUrl, topic, token, expiresIn }`.
 * 3. Open an upstream subscription to `${hubUrl}?topic=${topic}` with
 *    `Authorization: Bearer ${token}`.
 * 4. Pipe the upstream `text/event-stream` body straight back to the
 *    browser without buffering, with the SSE-friendly headers Next/Node
 *    won't otherwise add.
 *
 * The subscriber JWT lives only inside this Node process — it never
 * reaches the browser. On reconnect (token expiry, network blip,
 * idle-timeout) the hook re-opens the EventSource, this route runs again,
 * and a fresh token is minted by Symfony.
 *
 * ## Wire contract (browser side)
 *
 *   GET /api/auth/events          (same-origin SSE)
 *
 *   Events emitted:
 *     - `acl-changed`  data: { aclVersion: string }   fired whenever the
 *                       authenticated user's ACL membership changes
 *                       (group/role mutation, async job grant, profile
 *                       edit, etc.).
 *
 *   Mercure protocol-level frames (`Last-Event-ID`, `:` heartbeats,
 *   reconnect time hints) flow through unchanged and are handled by the
 *   browser's EventSource transparently.
 *
 * ## Why a dedicated route?
 *
 * The catch-all proxy in `src/app/api/[...path]/route.ts` calls
 * `await upstream.text()` to handle JSON envelopes + token rotation,
 * which would buffer the Mercure response forever. SSE needs streaming.
 * It also never carries rotated tokens (a long-lived subscription
 * pre-dates any new access token), so it doesn't need that machinery.
 *
 * CSRF validation is skipped here intentionally — `EventSource` cannot
 * attach custom headers, and SSE is GET-only and idempotent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    AUTH_COOKIE,
    SYMFONY_API_PREFIX,
    SYMFONY_INTERNAL_URL,
} from '../../../../config/server.config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface MercureBootstrap {
    hubUrl: string;
    topic: string;
    token: string;
    expiresIn: number;
}

/**
 * Pull the Mercure discovery payload out of Symfony's response envelope.
 *
 * Symfony's `ApiResponseFormatter` wraps successful payloads as
 * `{ status, message, data, ... }`, but this controller (`AuthEventsController`)
 * returns a plain `JsonResponse` to keep the body small. We therefore
 * tolerate both shapes and only require the four discovery fields.
 */
function extractBootstrap(payload: unknown): MercureBootstrap | null {
    if (typeof payload !== 'object' || payload === null) return null;

    // Either the raw object or `{ data: { … } }` from the standard envelope.
    const candidate =
        'hubUrl' in (payload as Record<string, unknown>)
            ? (payload as Record<string, unknown>)
            : ((payload as Record<string, unknown>).data as
                  | Record<string, unknown>
                  | undefined);

    if (!candidate || typeof candidate !== 'object') return null;
    const { hubUrl, topic, token, expiresIn } = candidate as Record<string, unknown>;
    if (
        typeof hubUrl !== 'string' ||
        typeof topic !== 'string' ||
        typeof token !== 'string'
    ) {
        return null;
    }
    return {
        hubUrl,
        topic,
        token,
        expiresIn: typeof expiresIn === 'number' ? expiresIn : 3600,
    };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const jar = await cookies();
    const jwt = jar.get(AUTH_COOKIE)?.value;
    if (!jwt) {
        return NextResponse.json(
            {
                error: 'Unauthorized',
                logged_in: false,
                status: 401,
                message: 'Authentication required',
                meta: {},
                data: null,
            },
            { status: 401 }
        );
    }

    // Step 1: get hub URL + per-user topic + subscriber JWT from Symfony.
    let bootstrap: MercureBootstrap;
    try {
        const bootstrapRes = await fetch(
            `${SYMFONY_INTERNAL_URL}${SYMFONY_API_PREFIX}/auth/events`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    Accept: 'application/json',
                    'X-Client-Type': 'web',
                },
                cache: 'no-store',
                next: { revalidate: 0 },
            }
        );

        if (!bootstrapRes.ok) {
            // 401 from upstream means the JWT expired between the cookie
            // read and the bootstrap call — surface the status so the
            // browser EventSource closes; the hook's backoff plus our
            // silent-refresh interceptor will recover on the next attempt.
            return new NextResponse(null, { status: bootstrapRes.status });
        }

        const parsed = extractBootstrap(await bootstrapRes.json());
        if (!parsed) {
            return new NextResponse(null, { status: 502 });
        }
        bootstrap = parsed;
    } catch {
        return new NextResponse(null, { status: 503 });
    }

    // Step 2: subscribe to the Mercure hub. The hub holds the long-lived
    // SSE socket; we just pipe its body to the browser.
    const subscribeUrl = `${bootstrap.hubUrl}?topic=${encodeURIComponent(bootstrap.topic)}`;

    let hubResponse: Response;
    try {
        hubResponse = await fetch(subscribeUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${bootstrap.token}`,
                Accept: 'text/event-stream',
                'Cache-Control': 'no-cache',
            },
            cache: 'no-store',
            next: { revalidate: 0 },
            // Forward the browser's abort signal so closing the page tears
            // down the upstream subscription instead of leaking it.
            signal: req.signal,
        } as RequestInit);
    } catch {
        // Hub unreachable. EventSource will surface `error` and reconnect.
        return new NextResponse(null, { status: 503 });
    }

    if (!hubResponse.ok || !hubResponse.body) {
        return new NextResponse(null, { status: hubResponse.status || 502 });
    }

    // Step 3: pipe the body straight through. `Cache-Control: no-transform`
    // and `X-Accel-Buffering: no` defeat any reverse proxy / nginx layer
    // that would otherwise buffer SSE frames between the BFF and the
    // browser.
    return new NextResponse(hubResponse.body, {
        status: 200,
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
