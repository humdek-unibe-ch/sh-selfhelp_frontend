/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Page draft version (live-sync contract C8): the number the page editor holds for the draft it
 * is looking at.
 *
 * Every draft write of a page (about 20 routes under `/admin/pages/{page_id}/...`) names the
 * version it is based on in `X-Page-Version`. The server refuses a missing value (400) and an old
 * one (409 `stale_page_version`), and answers a write that ran with the new version in the same
 * header. This module is the one place that knows which requests those are, keeps the number per
 * page, and puts writes of one page in a line so the second never leaves with the version the
 * first has already used. `base.api.ts` calls it from its interceptors; nothing else sends the header.
 *
 * The number only grows (`rememberPageDraftVersion`): a read that was started before a write and
 * lands after it must not move the editor back. The one exception is the server saying so
 * (`409`, `current_version`).
 */
import { HEADER_PAGE_VERSION } from '@selfhelp/shared';

export { HEADER_PAGE_VERSION };

const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/** `/admin/pages/<id>` and everything below it. `/admin/pages/import` and `/export` have no numeric id. */
const PAGE_PATH = /^\/admin\/pages\/(\d+)(\/[^?]*)?(\?.*)?$/;

/** The lock routes are not draft writes: they carry no version (C9). */
const LOCK_PATH = /^\/lock(\/|$)/;

/** A write waits this long for the one before it, then goes anyway (a hung request never blocks the editor for good). */
const WRITE_QUEUE_PATIENCE_MS = 30_000;

type TVersionListener = (pageId: number, version: number) => void;

const versions = new Map<number, number>();
const listeners = new Set<TVersionListener>();
const tails = new Map<number, Promise<void>>();

let versionLoader: ((pageId: number) => Promise<unknown>) | null = null;

/** The page id when this request is a draft write of that page, otherwise `null`. */
export function draftWritePageId(method: string | undefined, url: string | undefined): number | null {
    if (!UNSAFE_METHODS.has((method ?? 'get').toLowerCase()) || !url) {
        return null;
    }
    const match = PAGE_PATH.exec(url);
    if (!match) {
        return null;
    }
    if (match[2] !== undefined && LOCK_PATH.test(match[2])) {
        return null;
    }
    return Number(match[1]);
}

/** The page id of any request under `/admin/pages/<id>` (a read carries the version header too), otherwise `null`. */
export function adminPageIdOfUrl(url: string | undefined): number | null {
    const match = url ? PAGE_PATH.exec(url) : null;
    return match ? Number(match[1]) : null;
}

export function getPageDraftVersion(pageId: number): number | undefined {
    return versions.get(pageId);
}

/**
 * Keep the version the server named. Only a higher number replaces the held one, unless `force`
 * is set (the server's `current_version` after a `409`).
 */
export function rememberPageDraftVersion(pageId: number, version: unknown, force = false): void {
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
        return;
    }
    const held = versions.get(pageId);
    if (held !== undefined && held === version) {
        return;
    }
    if (!force && held !== undefined && held > version) {
        return;
    }
    versions.set(pageId, version);
    for (const listener of [...listeners]) {
        listener(pageId, version);
    }
}

/** Read the header of a reply (`X-Page-Version`), for any reply under the page's routes. */
export function rememberPageDraftVersionFromHeaders(pageId: number, headers: unknown): void {
    const raw = readHeader(headers, HEADER_PAGE_VERSION);
    if (raw !== null && /^[1-9][0-9]{0,9}$/.test(raw)) {
        rememberPageDraftVersion(pageId, Number(raw));
    }
}

/** Called when the held version changes (the page editor counts it as a write of its own). */
export function subscribePageDraftVersion(listener: TVersionListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * The editor's page read, used to learn the version when a write is about to leave without one
 * (a publish from a list, a first write after a reload). Registered by `page.api.ts`.
 */
export function registerPageDraftVersionLoader(loader: (pageId: number) => Promise<unknown>): void {
    versionLoader = loader;
}

/** The version for this write: the held one, or the one the loader reads. `undefined` when neither is possible. */
export async function resolvePageDraftVersion(pageId: number): Promise<number | undefined> {
    if (versions.get(pageId) === undefined && versionLoader !== null) {
        try {
            await versionLoader(pageId);
        } catch {
            /* the write goes without it and the server says so (400) */
        }
    }
    return versions.get(pageId);
}

/**
 * Wait for this page's earlier writes, then return the function that lets the next one go. Two
 * writes started together would both leave with the same number, and the second would be refused
 * as stale by the first. Call the release function when the reply (or the error) is in.
 */
export async function enterPageDraftWrite(pageId: number): Promise<() => void> {
    const previous = tails.get(pageId) ?? Promise.resolve();
    let release!: () => void;
    const mine = new Promise<void>((resolve) => {
        release = resolve;
    });
    tails.set(pageId, mine);

    let patience: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
        previous,
        new Promise<void>((resolve) => {
            patience = setTimeout(resolve, WRITE_QUEUE_PATIENCE_MS);
        }),
    ]);
    clearTimeout(patience);

    return () => {
        release();
        if (tails.get(pageId) === mine) {
            tails.delete(pageId);
        }
    };
}

/** Test helper: forget everything. */
export function resetPageDraftVersionsForTests(): void {
    versions.clear();
    listeners.clear();
    tails.clear();
    versionLoader = null;
}

function readHeader(headers: unknown, name: string): string | null {
    if (!headers || typeof headers !== 'object') {
        return null;
    }
    const lower = name.toLowerCase();
    const bag = headers as { get?: (key: string) => unknown } & Record<string, unknown>;
    if (typeof bag.get === 'function') {
        const viaGet = bag.get(lower) ?? bag.get(name);
        if (typeof viaGet === 'string') {
            return viaGet;
        }
    }
    const direct = bag[lower] ?? bag[name];
    return typeof direct === 'string' ? direct : null;
}
