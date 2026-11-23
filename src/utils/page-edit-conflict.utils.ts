/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * What the server refused on a page's draft write (live-sync contracts C8 and C9), told to the page
 * editor.
 *
 * - `stale`: `409 stale_page_version`. The draft was changed elsewhere. The editor reloads the
 *   draft and holds the unsaved values of its inspectors (they are shown until the person saves
 *   them on top or discards them): {@link holdStaleConflict} and {@link isStaleConflictHeld}.
 * - `locked`: `409 page_locked`. Someone else holds the edit lock; the status of the lock is the
 *   data of the answer, so the editor can say who.
 *
 * `base.api.ts` raises both from its response interceptor, so every draft write is covered, not
 * only the ones the editor started itself.
 *
 * This module must stay free of React: `base.api.ts` imports it, and server components import
 * `base.api.ts`.
 */
import type { IPageLockStatus } from '@selfhelp/shared';

export type TPageEditConflict =
    | { kind: 'stale'; pageId: number; currentVersion: number | null }
    | { kind: 'locked'; pageId: number; status: IPageLockStatus | null };

type TConflictListener = (conflict: TPageEditConflict) => void;

const listeners = new Set<TConflictListener>();
/** Pages whose draft was refused as stale and whose inspectors still show unsaved values. */
let heldPages: ReadonlySet<number> = new Set();

/** Listen to every conflict. Returns the unsubscribe function. */
export function subscribePageEditConflict(listener: TConflictListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function notifyPageEditConflict(conflict: TPageEditConflict): void {
    if (conflict.kind === 'stale') {
        holdStaleConflict(conflict.pageId);
    }
    for (const listener of [...listeners]) {
        try {
            listener(conflict);
        } catch {
            /* a listener never breaks the others */
        }
    }
}

/** The inspectors of this page keep their unsaved values until {@link clearStaleConflict}. */
export function holdStaleConflict(pageId: number): void {
    if (!heldPages.has(pageId)) {
        heldPages = new Set([...heldPages, pageId]);
    }
}

/** A draft write of the page went through, or the person discarded their edits: the inspectors follow the server again. */
export function clearStaleConflict(pageId: number): void {
    if (heldPages.has(pageId)) {
        const next = new Set(heldPages);
        next.delete(pageId);
        heldPages = next;
    }
}

export function isStaleConflictHeld(pageId: number | null | undefined): boolean {
    return pageId != null && heldPages.has(pageId);
}

/** Test helper: forget everything. */
export function resetPageEditConflictsForTests(): void {
    listeners.clear();
    heldPages = new Set();
}
