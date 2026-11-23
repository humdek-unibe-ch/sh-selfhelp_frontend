/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Reload what the page editor shows of one page's draft: the page and its fields, the section
 * tree, the section details, the publish state and the version list. Used when someone else
 * changed the draft (`page_draft:<id>` without our lock), when a write was refused as stale, and
 * after a take-over. A hidden tab only marks the queries stale (the sync rule "only while
 * opened"); they refetch when the tab is visible again.
 */
import type { QueryClient } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

const QUERY_KEYS = REACT_QUERY_CONFIG.QUERY_KEYS;

/** Position of the page id in a section-details key (`SECTION_DETAILS`). */
const SECTION_DETAILS_PAGE_ID_INDEX = 3;

export function invalidatePageDraftQueries(queryClient: QueryClient, pageId: number): Promise<unknown> {
    const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const refetchType = hidden ? 'none' : 'active';
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAGE_FIELDS(pageId), refetchType }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAGE_SECTIONS(pageId), refetchType }),
        queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.SECTION_DETAILS_ALL,
            predicate: (query) => Number(query.queryKey[SECTION_DETAILS_PAGE_ID_INDEX]) === pageId,
            refetchType,
        }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNPUBLISHED_CHANGES(pageId), refetchType }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAGE_VERSIONS(pageId), refetchType }),
    ]);
}
