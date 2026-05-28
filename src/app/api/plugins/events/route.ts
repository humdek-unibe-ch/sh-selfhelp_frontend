/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * BFF Mercure subscription proxy — **plugin topics**.
 *
 * Browsers cannot speak directly to the Mercure hub (the JWT must be
 * sent as a request header, which `EventSource` cannot set). This
 * route mirrors `/api/auth/events` but multiplexes only the plugin
 * topic IRIs the backend authorised for the current user.
 *
 * Flow:
 *
 *   browser EventSource → /api/plugins/events → Mercure hub
 *
 * 1. Read the session JWT from the same cookies the auth events route
 *    uses (`sh_impersonate` first, fallback `sh_auth`).
 * 2. Call Symfony's `GET /cms-api/v1/auth/events` to mint a fresh
 *    Mercure subscriber JWT. The backend's `AuthEventsController`
 *    dispatches `PluginRealtimePermissionEvent` and returns the list
 *    of plugin topic IRIs the user is allowed to subscribe to in
 *    `pluginTopics`.
 * 3. Open ONE upstream SSE connection scoped to every IRI in
 *    `pluginTopics`. The hub holds the long-lived socket; this BFF
 *    just pipes the body back unbuffered.
 *
 * The route never emits anything when the user has zero plugin
 * subscriptions — it returns 204 so the browser stops the
 * `EventSource` (no retry storm).
 *
 * Plugins receive events through `usePluginRealtime()` (web) or the
 * mobile equivalent. Plugin code never opens its own EventSource.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    AUTH_COOKIE,
    IMPERSONATE_COOKIE,
    SYMFONY_API_PREFIX,
    SYMFONY_INTERNAL_URL,
} from '../../../../config/server.config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface MercureBootstrap {
    hubUrl: string;
    pluginTopics: string[];
    token: string;
    expiresIn: number;
}

function extractBootstrap(payload: unknown): MercureBootstrap | null {
    if (typeof payload !== 'object' || payload === null) return null;

    const candidate =
        'hubUrl' in (payload as Record<string, unknown>)
            ? (payload as Record<string, unknown>)
            : ((payload as Record<string, unknown>).data as
                  | Record<string, unknown>
                  | undefined);

    if (!candidate || typeof candidate !== 'object') return null;
    const { hubUrl, pluginTopics, token, expiresIn } = candidate as Record<string, unknown>;
    if (typeof hubUrl !== 'string' || typeof token !== 'string') {
        return null;
    }
    const topics: string[] = Array.isArray(pluginTopics)
        ? pluginTopics.filter((t): t is string => typeof t === 'string')
        : [];
    return {
        hubUrl,
        pluginTopics: topics,
        token,
        expiresIn: typeof expiresIn === 'number' ? expiresIn : 3600,
    };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const jar = await cookies();
    const jwt = jar.get(IMPERSONATE_COOKIE)?.value ?? jar.get(AUTH_COOKIE)?.value;
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

    if (bootstrap.pluginTopics.length === 0) {
        // No plugin topics granted for this user. Send 204 so the
        // browser EventSource stops without retrying — there is
        // nothing to subscribe to.
        return new NextResponse(null, { status: 204 });
    }

    const params = bootstrap.pluginTopics
        .map((iri) => `topic=${encodeURIComponent(iri)}`)
        .join('&');
    const subscribeUrl = `${bootstrap.hubUrl}?${params}`;

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
            signal: req.signal,
        } as RequestInit);
    } catch {
        return new NextResponse(null, { status: 503 });
    }

    if (!hubResponse.ok || !hubResponse.body) {
        return new NextResponse(null, { status: hubResponse.status || 502 });
    }

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
