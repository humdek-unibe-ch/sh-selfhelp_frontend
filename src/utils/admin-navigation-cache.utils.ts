/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { QueryClient } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/** Invalidate every admin navigation reader (sidebar preview + builder overview). */
export async function invalidateAdminNavigationQueries(queryClient: QueryClient): Promise<void> {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_NAVIGATION_ALL }),
        queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.NAVIGATION_ALL }),
        queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES_ALL }),
    ]);
}
