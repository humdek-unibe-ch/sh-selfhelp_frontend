/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The page the client keeps from a page response.
 *
 * The backend answers `{ data: { page, sync } }`: the live-sync block (contract C6) sits next to
 * the page, not inside it. The tag map (`sync-tags.utils.ts`) and the `valid_until` refetch read it
 * from the cached page (`IPageContent.sync`), so every place that unwraps a page response goes
 * through here and the block travels with the page. Without it a `changed` message names a page
 * that no cached payload claims, and nothing on screen is refetched.
 *
 * No React in this module: server components import it (through `server-fetch.ts`).
 */
import type { IPageContent, ISyncBlock } from '../shared';

/** The `data` of a page response (`/pages/by-keyword`, `/pages/resolve`). */
export interface IPagePayload {
    page?: IPageContent | null;
    sync?: ISyncBlock | null;
}

/** The page of a response's `data`, carrying the response's `sync` block. `null` when the response has no page. */
export function pageFromPayload(payload: IPagePayload | null | undefined): IPageContent | null {
    const page = payload?.page;
    if (!page) {
        return null;
    }
    // An older server (or a payload built elsewhere) may have put the block on the page already.
    const sync = payload.sync ?? page.sync;
    return sync ? { ...page, sync } : page;
}
