/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * External referrer host for the admin "Referrers" analytics card.
 *
 * The backend counts a referrer when a page request carries the
 * `X-Referrer-Host` header (a bare host name, no scheme, port or path) and
 * the page view is recorded. Only the web client sends it; the mobile app has
 * no referrer and sends none.
 *
 * Who sends it, and when (at most once per visit):
 * - On the server, the slug route reads the incoming `Referer` header
 *   (`server-fetch.ts`). That is the common case: a visitor arriving from an
 *   outside site is rendered on the server, and the page fetch carries the host.
 * - When that server render seeds the landing page into the React Query cache,
 *   the client dismisses the browser snapshot (`dismissLandingReferrerHost` from
 *   `DynamicPageClient`) so a later browser fetch of the same path (language
 *   switch, invalidation) never sends the header again.
 * - The browser snapshot is handed out only when the server did not deliver the
 *   landing page: `consumeLandingReferrerHost` then sends it once, for the
 *   landing path only. Clicking through the site, or a hover prefetch of
 *   another page, never carries it.
 *
 * A referrer from the site itself is never sent: the backend only knows its
 * own internal host name behind the BFF, so it cannot tell.
 */
import { normalizePagesResolvePath } from '@selfhelp/shared';

/** Request header the backend reads. */
export const REFERRER_HOST_HEADER = 'X-Referrer-Host';

/** Length of the backend column (`page_view_referrers.referrer_host`). */
const MAX_HOST_LENGTH = 190;

/**
 * Host name (no port) of a `Host` / `X-Forwarded-Host` value, lower-case, or
 * `null`. A forwarded list (`a.example, b.example`) uses its first entry.
 */
function hostnameOfHostHeader(value: string | null | undefined): string | null {
    const first = value?.split(',')[0]?.trim();
    if (!first) return null;
    try {
        return new URL(`http://${first}`).hostname || null;
    } catch {
        return null;
    }
}

/**
 * The host of an outside referrer, or `null` when nothing should be sent.
 *
 * `null` for: no referrer, a value that is not an http(s) URL (an app link,
 * `file:`), an unusable host, and a referrer from the site itself.
 *
 * @param referrer The `Referer` header or `document.referrer`.
 * @param ownHost The host this site is served from (`Host` / `X-Forwarded-Host`).
 */
export function externalReferrerHost(
    referrer: string | null | undefined,
    ownHost: string | null | undefined,
): string | null {
    if (!referrer) return null;

    let url: URL;
    try {
        url = new URL(referrer);
    } catch {
        return null;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    // `URL` lower-cases the host and drops the port.
    const host = url.hostname;
    if (!host || host.length > MAX_HOST_LENGTH) return null;
    if (host === hostnameOfHostHeader(ownHost)) return null;

    return host;
}

interface ILandingReferrer {
    /** Normalised path of the landing page. */
    path: string;
    /** Outside host the visitor came from, or `null`. */
    host: string | null;
}

let landing: ILandingReferrer | null = null;

function snapshotLanding(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        landing = null;
        return;
    }
    landing = {
        path: normalizePagesResolvePath(window.location.pathname),
        host: externalReferrerHost(document.referrer, window.location.host),
    };
}

// Taken when the browser bundle starts, while the address is still the landing page.
snapshotLanding();

/**
 * Hands out the landing referrer host once.
 *
 * The first page request of the browser session uses up the single chance,
 * whatever its path is. It returns the host only when that request is for the
 * landing path, so a later page never inherits a referrer that belongs to the
 * landing page.
 *
 * Call this only when the browser itself must load the landing page. When the
 * server render already seeded it, call {@link dismissLandingReferrerHost}
 * instead so a later refetch does not send a second `X-Referrer-Host`.
 *
 * @param requestPath The public path being requested.
 */
export function consumeLandingReferrerHost(requestPath: string): string | null {
    const current = landing;
    landing = null;

    if (!current?.host) return null;
    return normalizePagesResolvePath(requestPath) === current.path ? current.host : null;
}

/**
 * Drops the browser landing snapshot when the server already delivered that
 * page (and already sent `X-Referrer-Host` on the server render).
 *
 * No-op when there is no snapshot, or when `seededPath` is not the landing
 * path (a hydrated navigation to another page must not clear a still-pending
 * landing fallback).
 *
 * @param seededPath The public path whose query was seeded from the server.
 */
export function dismissLandingReferrerHost(seededPath: string): void {
    const current = landing;
    if (!current) return;
    if (normalizePagesResolvePath(seededPath) !== current.path) return;
    landing = null;
}

/** Takes the landing snapshot again from the current `document` (tests only). */
export function resetLandingReferrerForTests(): void {
    snapshotLanding();
}
