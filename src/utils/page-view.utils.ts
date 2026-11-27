/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Page views (contract C7, finding F135).
 *
 * The backend records a page view only when the page request carries `X-Page-View: 1`. The web
 * client sends it on exactly one fetch per navigation:
 *
 * - **Direct load and in-app navigation:** the server render of the slug route
 *   (`server-fetch.ts`, the fetch of the page body, once per request; the metadata and layout
 *   fetches carry nothing, because Next.js renders those alone for a link prefetch and its own
 *   prefetch headers are stripped before the server can see them). The Next.js router asks the
 *   server for the new page on every in-app navigation, so that render is the navigation's fetch.
 * - **A client fetch that has to load the page itself** (the server delivered nothing): the
 *   fetch of {@link claimPageView}, once per path until another page was shown.
 *
 * It is never sent on a prefetch, a live refetch (`changed` message), a `valid_until` refetch, a
 * language switch, a focus refetch or in preview. `X-Referrer-Host` travels on the same request
 * (F126, `referrer-host.utils.ts`).
 */
import { normalizePagesResolvePath } from '@selfhelp/shared';

/** Request header the backend reads. */
export const PAGE_VIEW_HEADER = 'X-Page-View';
/** The only value the backend counts. */
export const PAGE_VIEW_HEADER_VALUE = '1';

/** Normalised path of the page this browser tab counted last (or was told was counted). */
let lastViewedPath: string | null = null;

/**
 * The page at `path` is on screen and its view was counted (by the server render, or by the
 * client fetch that claimed it). Later fetches of the same path are not new views.
 */
export function markPageViewed(path: string): void {
    lastViewedPath = normalizePagesResolvePath(path);
}

/**
 * Whether a client fetch of `path` is the one that counts the view: true once per visit of a
 * path. Visiting another page and coming back is a new visit; a refetch of the page that is
 * already shown is not.
 */
export function claimPageView(path: string): boolean {
    const normalized = normalizePagesResolvePath(path);
    if (lastViewedPath === normalized) {
        return false;
    }
    lastViewedPath = normalized;
    return true;
}

/** Forget what was counted (tests only). */
export function resetPageViewForTests(): void {
    lastViewedPath = null;
}
