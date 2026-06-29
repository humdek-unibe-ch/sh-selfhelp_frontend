/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery } from '@tanstack/react-query';
import { AdminSectionApi } from '../api/admin/section.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Fetches the interpolation variable picker for a section as a `token => label`
 * map (issue #56).
 *
 * This is deliberately separate from `useSectionDetails`: the variables depend
 * on the referenced data tables' live columns, and a column created by a form
 * submission does not invalidate the section cache. The query uses the
 * REAL_TIME tier (staleTime 0) and refetches on mount + window focus, so every
 * time the section inspector opens (or the operator returns to the tab) the
 * picker reflects the current columns — including ones just added by a
 * submission — without re-saving the section.
 *
 * @param sectionId - The section to resolve variables for
 * @param enabled - Whether the query should run (e.g. inspector is open)
 * @returns React Query result with the token => label map
 */
export function useSectionDataVariables(sectionId: number | null, enabled: boolean = true) {
    const isEnabled = enabled && sectionId !== null && sectionId !== undefined && !isNaN(sectionId);

    return useQuery<Record<string, string>>({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.SECTION_DATA_VARIABLES(sectionId),
        queryFn: async () => {
            if (!sectionId) {
                throw new Error(`Missing required parameter: sectionId=${sectionId}`);
            }
            return AdminSectionApi.getSectionDataVariables(sectionId);
        },
        enabled: isEnabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.REAL_TIME.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.REAL_TIME.gcTime,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}
