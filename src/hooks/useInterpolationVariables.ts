/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery } from '@tanstack/react-query';
import { AdminInterpolationApi, type TInterpolationContext } from '../api/admin/interpolation.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * The single hook every CMS editor surface uses to fetch its interpolation
 * `{{ }}` variable picker as a `token => label` map (issue #56 v2).
 *
 * One unified, context-aware backend endpoint backs all surfaces (section
 * content, condition builder, data-config SQL filter, custom CSS, page/config
 * fields, action subject/body, global values), so the catalog is defined once
 * and only ever offers tokens that interpolate at runtime. The token is the
 * immutable interpolation key persisted as `{{token}}`; the label is the human
 * display name shown in the picker.
 *
 * Uses the REAL_TIME tier (staleTime 0) and refetches on mount + window focus,
 * so a data column added by a later form submission appears in the picker
 * without re-saving — the data does not ride along in any cached entity payload.
 *
 * @param context section | page | action | global
 * @param id      Context target: section id (`section`), page id (`page`), or
 *                the action's source data-table id (`action`). Ignored for
 *                `global`; pass null when not yet known.
 * @param enabled Whether the query should run (e.g. the editor is open).
 * @returns React Query result with the token => label map
 */
export function useInterpolationVariables(
    context: TInterpolationContext,
    id: number | null = null,
    enabled: boolean = true,
) {
    // `page`, `section` and `action` (with a chosen data table) target a record
    // by id; `global` never needs one. Only block the id-targeted contexts when
    // their id is missing so e.g. an action with no data table still resolves
    // recipient/system/globals.
    const idTargeted = context === 'section' || context === 'page';
    const hasUsableId = id !== null && id !== undefined && !isNaN(id);
    const isEnabled = enabled && (!idTargeted || hasUsableId);

    return useQuery<Record<string, string>>({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.INTERPOLATION_VARIABLES(context, id),
        queryFn: async () => AdminInterpolationApi.getVariables(context, id),
        enabled: isEnabled,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.REAL_TIME.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.REAL_TIME.gcTime,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}
