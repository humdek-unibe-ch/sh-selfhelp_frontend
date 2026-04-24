/**
 * Narrow subscription hook for a single admin page by keyword.
 *
 * Delegates to the authoritative `useAdminPages()` hook so there is exactly
 * one `useQuery` instance bound to the `['admin-pages']` key and one
 * `enabled` gate across the entire admin session. Consumers that only need
 * the matching `IAdminPage` get it via a cheap `useMemo` lookup over the
 * already-transformed `allPages` array — unrelated admin-pages re-renders
 * only fire if the selected page's record itself changed.
 *
 * Use this in inspectors/editors that only need one page identity; use
 * `useAdminPages` for list/tree views that need the full transformed
 * dataset.
 *
 * @module hooks/useSelectedAdminPage
 */

import { useMemo } from 'react';
import type { IAdminPage } from '../types/responses/admin/admin.types';
import { useAdminPages } from './useAdminPages';

export function useSelectedAdminPage(keyword: string | null | undefined) {
    const { pages, isLoading, isFetching, error } = useAdminPages();

    const page = useMemo<IAdminPage | null>(() => {
        if (!keyword || !Array.isArray(pages) || pages.length === 0) return null;
        return pages.find((p) => p.keyword === keyword) ?? null;
    }, [pages, keyword]);

    return {
        page,
        isLoading,
        isFetching,
        error,
    };
}
