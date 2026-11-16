/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { QueryClient } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

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
