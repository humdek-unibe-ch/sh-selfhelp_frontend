/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Live sync: the one place that maps the tags of a `changed` message to query invalidations.
 *
 * The server decides who gets a message and what it names (contract C1 and C3). The client only
 * matches the tags it received against what is on screen:
 *
 * | Tag | Effect |
 * | --- | --- |
 * | `acl` | user data (the existing `useAclVersionWatcher` cascade follows), navigation |
 * | `navigation` | navigation and the frontend page list |
 * | `page:<id>`, `page_draft:<id>`, `table:<id>`, `global_values` | the cached page payloads whose `sync.depends_on` names the tag; for `table:` also the form lists and data views of those pages |
 * | `section:<id>` | the section details (F56) |
 * | `asset:<id>` | the asset lists; the asset selection is told through {@link subscribeSyncTags} (F121) |
 * | `page_lock:<id>` | nothing here; the page editor listens through {@link subscribeSyncTags} |
 *
 * The roots come from the query-key registry. A hidden tab only marks queries stale
 * (`refetchType: 'none'`) and {@link refetchInvalidatedQueries} refetches them when the tab is
 * visible again, so a background tab costs nothing (decision "only while opened").
 *
 * This is not polling: every call here is the answer to a message the server pushed
 * (rule 6.3).
 */
import type { QueryClient, Query } from '@tanstack/react-query';
import { pageDependsOn, syncRefetchDelayMs } from '@selfhelp/shared';
import type { IPageContent } from '../types/common/pages.type';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

const QUERY_KEYS = REACT_QUERY_CONFIG.QUERY_KEYS;

/** Tags a page payload can list in `sync.depends_on` (everything else is handled on its own). */
const PAGE_DEPENDENCY_TAG = /^(page:\d+|page_draft:\d+|table:\d+|global_values)$/;

/** Position of the page id in a form-list key (`formListCacheKey`). */
const FORM_LIST_PAGE_ID_INDEX = 5;
/** Position of the section id in a section-details key (`SECTION_DETAILS`). */
const SECTION_DETAILS_SECTION_ID_INDEX = 4;

type TTagListener = (tags: readonly string[]) => void;
type TTagIgnore = (tag: string) => boolean;

const listeners = new Set<TTagListener>();
const ignores = new Set<TTagIgnore>();

/**
 * Listen to every `changed` message after the ignore filters ran. Screens whose state is not a
 * query use this (the asset selection, the page editor lock). Returns the unsubscribe function.
 */
export function subscribeSyncTags(listener: TTagListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Hook point for the page editor: a tag for which `ignore` returns `true` is dropped before it
 * reaches the cache. The editor ignores `page_draft:<id>` of a page whose lock the caller holds,
 * because the caller's own writes must not refetch the editor under them. Returns the
 * unregister function.
 */
export function registerSyncTagIgnore(ignore: TTagIgnore): () => void {
    ignores.add(ignore);
    return () => {
        ignores.delete(ignore);
    };
}

function isHidden(): boolean {
    return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function pageSync(query: Query): IPageContent['sync'] | undefined {
    const data = query.state.data as IPageContent | undefined;
    return data && typeof data === 'object' ? data.sync : undefined;
}

function pageIdOf(query: Query): number | null {
    const data = query.state.data as IPageContent | undefined;
    return data && typeof data.id === 'number' ? data.id : null;
}

/**
 * Apply the tags of one change message to the query cache. Synchronous: callers that want the
 * random spreading delay use {@link handleSyncMessage}.
 */
export function applySyncTags(queryClient: QueryClient, rawTags: readonly string[]): void {
    const tags = rawTags.filter((tag) => ![...ignores].some((ignore) => ignore(tag)));
    if (tags.length === 0) {
        return;
    }
    const refetchType = isHidden() ? 'none' : 'active';
    const tagSet = new Set(tags);

    if (tagSet.has('acl')) {
        // User data first: its refetch carries the new `aclVersion` / `acl_stamp`, which makes
        // `useAclVersionWatcher` run its cascade. Navigation is named here as well because the
        // watcher only runs when the signature moved (F251).
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_DATA, refetchType });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NAVIGATION_ALL, refetchType });
    }

    if (tagSet.has('navigation')) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NAVIGATION_ALL, refetchType });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRONTEND_PAGES_ALL, refetchType });
    }

    const pageTags = tags.filter((tag) => PAGE_DEPENDENCY_TAG.test(tag));
    if (pageTags.length > 0) {
        const dependsOnTags = (query: Query): boolean => pageDependsOn(pageSync(query), pageTags);

        const matched = queryClient.getQueryCache().findAll({
            queryKey: QUERY_KEYS.PAGE_BY_KEYWORD_ALL,
            predicate: dependsOnTags,
        });
        const matchedPageIds = new Set<number>();
        for (const query of matched) {
            const id = pageIdOf(query);
            if (id !== null) {
                matchedPageIds.add(id);
            }
        }

        if (matched.length > 0) {
            void queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.PAGE_BY_KEYWORD_ALL,
                predicate: dependsOnTags,
                refetchType,
            });
        }

        if (tags.some((tag) => tag.startsWith('table:'))) {
            // The lists and data views a page draws: matched through the page that depends on the
            // table. A list whose page is not cached (or has no `sync` block, an older server)
            // cannot be matched, so every list is marked then; only the ones on screen refetch.
            void queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.FORM_LIST_ALL,
                predicate: (query) =>
                    matchedPageIds.size === 0 ||
                    matchedPageIds.has(Number(query.queryKey[FORM_LIST_PAGE_ID_INDEX])),
                refetchType,
            });
        }

        if (tags.some((tag) => tag.startsWith('page:'))) {
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_PAGES, refetchType });
        }
    }

    const sectionIds = new Set(
        tags.filter((tag) => tag.startsWith('section:')).map((tag) => Number(tag.slice('section:'.length))),
    );
    if (sectionIds.size > 0) {
        void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.SECTION_DETAILS_ALL,
            predicate: (query) => sectionIds.has(Number(query.queryKey[SECTION_DETAILS_SECTION_ID_INDEX])),
            refetchType,
        });
    }

    if (tags.some((tag) => tag.startsWith('asset:'))) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ASSETS_ALL, refetchType });
    }

    for (const listener of [...listeners]) {
        try {
            listener(tags);
        } catch {
            /* a listener never breaks the others */
        }
    }
}

/**
 * A `changed` message arrived: wait the random spreading delay (0 to 300 ms) and apply it.
 * Returns the cancel function (used when the stream is closed before the timer fired);
 * `onDone` runs when the timer fired.
 */
export function handleSyncMessage(
    queryClient: QueryClient,
    tags: readonly string[],
    onDone?: () => void,
): () => void {
    const timer = setTimeout(() => {
        onDone?.();
        applySyncTags(queryClient, tags);
    }, syncRefetchDelayMs('changed'));
    return () => clearTimeout(timer);
}

/**
 * The stream came back after a drop, so `changed` messages may have been missed. Mark what
 * messages can change as stale; the ones on screen refetch, the rest wait for their next use.
 */
export function reconcileAfterReopen(queryClient: QueryClient): void {
    const refetchType = isHidden() ? 'none' : 'active';
    for (const queryKey of [
        QUERY_KEYS.PAGE_BY_KEYWORD_ALL,
        QUERY_KEYS.NAVIGATION_ALL,
        QUERY_KEYS.FORM_LIST_ALL,
    ]) {
        void queryClient.invalidateQueries({ queryKey, refetchType });
    }
}

/**
 * A hidden tab only marked queries stale. When it is visible again, refetch the stale ones that
 * are on screen. Safe to call at any time; it does nothing when nothing was marked.
 */
export function refetchInvalidatedQueries(queryClient: QueryClient): void {
    void queryClient.refetchQueries({
        type: 'active',
        predicate: (query) => query.state.isInvalidated,
    });
}
