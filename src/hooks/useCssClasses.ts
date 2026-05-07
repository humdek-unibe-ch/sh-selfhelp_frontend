import { useQuery } from '@tanstack/react-query';
import { classifyClass } from '@selfhelp/shared';
import { FrontendApi } from '../api/frontend.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { ICssClassOption } from '../types/requests/admin/fields.types';

/**
 * Web-side CSS class catalogue: every Tailwind class the backend knows about.
 *
 * Used by the `css` field's dropdown. The list comes from
 * `public/assets/tailwind-classes.json` on the backend and is the full
 * Tailwind set — including responsive prefixes, dark variants and
 * focus/hover states that only make sense on web.
 */
export function useCssClasses() {
    return useQuery({
        queryKey: ['css-classes'],
        queryFn: async () => {
            const response = await FrontendApi.getCssClasses();
            return response.data.classes as ICssClassOption[];
        },
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.gcTime,
    });
}

/**
 * Mobile-safe subset of the CSS class catalogue.
 *
 * The native renderer (`sh-selfhelp_native_app`, react-expo + Uniwind)
 * only understands the curated allow-list defined in
 * `@selfhelp/shared/cms-classes`. Anything outside that list is dropped
 * by the native renderer with a dev warning. To stop authors picking
 * unsupported classes in the first place, the `css_mobile` field's
 * dropdown is filtered to the mobile-supported subset.
 *
 * What we do here:
 * 1. Reuse the same backend response as `useCssClasses` (one cache key,
 *    one HTTP round-trip — tanstack-query dedupes automatically).
 * 2. Run every option through `classifyClass`.
 *    - `allow`   → keep verbatim.
 *    - `remap`   → keep with the rewritten class name + a `(mobile)`
 *                  suffix in the human label so authors notice.
 *    - `drop`    → remove from the dropdown entirely.
 *
 * The `select` option is React Query v5's recommended hook for derived
 * data; it runs once per cache update and the result is memoised so
 * components don't re-render unnecessarily.
 */
export function useMobileCssClasses() {
    return useQuery({
        queryKey: ['css-classes'],
        queryFn: async () => {
            const response = await FrontendApi.getCssClasses();
            return response.data.classes as ICssClassOption[];
        },
        select: (classes: ICssClassOption[]): ICssClassOption[] => {
            const filtered: ICssClassOption[] = [];
            for (const option of classes) {
                const decision = classifyClass(option.value);
                if (decision.kind === 'allow') {
                    filtered.push(option);
                } else if (decision.kind === 'remap') {
                    filtered.push({
                        value: decision.to,
                        text: `${decision.to}  (mobile alias of ${decision.from})`,
                    });
                }
            }
            return filtered;
        },
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.gcTime,
    });
}
