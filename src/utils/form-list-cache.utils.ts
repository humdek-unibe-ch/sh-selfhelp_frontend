/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { QueryClient } from '@tanstack/react-query';
import type { IFormListState } from '@selfhelp/shared';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/** Position of the section id in a form-list key (`formListCacheKey`). */
const FORM_LIST_SECTION_ID_INDEX = 6;

/**
 * Cache handling of the form lists that does not need React: the auth
 * provider and the ACL watcher call these from outside any component.
 */

/** Mark every list's cached state stale (a write may change any list of the table) and read the visible ones again. */
export function invalidateFormList(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_ALL });
}

/**
 * Drop every cached list and every cached history (login, logout,
 * impersonation, server switch): the same URL shows other records, other
 * actions and other versions to other people.
 */
export function clearFormListCaches(queryClient: QueryClient): void {
    queryClient.removeQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_ALL });
    queryClient.removeQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_HISTORY_ALL });
}

/**
 * A write that changed one record answered with the record's new version (a quick action does,
 * F186). Put it into the cached list states of that section at once: the row actions read the
 * version from the row, so without this a second action started before the list is read again
 * (Approve, then Delete) would send the old version and be refused with 409.
 *
 * The list is still marked stale and read again by the caller; this only closes the gap until
 * that read lands.
 */
export function applyRecordVersionToFormLists(
    queryClient: QueryClient,
    sectionId: number,
    recordId: number,
    version: number,
): void {
    queryClient.setQueriesData<IFormListState>(
        {
            queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_ALL,
            predicate: (query) => Number(query.queryKey[FORM_LIST_SECTION_ID_INDEX]) === sectionId,
        },
        (state) => {
            if (!state || !Array.isArray(state.rows)) {
                return state;
            }
            const touchesRow = state.rows.some((row) => row.record_id === recordId);
            const touchesSelected = state.selected?.record_id === recordId;
            if (!touchesRow && !touchesSelected) {
                return state;
            }
            return {
                ...state,
                rows: state.rows.map((row) => (row.record_id === recordId ? { ...row, version } : row)),
                selected: touchesSelected && state.selected ? { ...state.selected, version } : state.selected,
            };
        },
    );
}
