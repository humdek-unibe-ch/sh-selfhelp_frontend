import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IAdminPage } from '../../types/responses/admin/admin.types';

/**
 * Admin store — holds only *navigation UI state*, not page content.
 *
 * Previously we stored the full `IAdminPage` object here; because the admin
 * pages tree comes from React Query and is re-derived on every refetch,
 * every consumer of `useSelectedPage()` re-rendered whenever any field on
 * any page changed. We now store only the selected *keyword* (a string) and
 * let consumers look up the actual page via `useSelectedAdminPage(keyword)`
 * which subscribes with a `select` to that one row only.
 */
export interface AdminState {
    selectedKeyword: string | null;
    expandedPageIds: Set<number>;
    setSelectedKeyword: (keyword: string | null) => void;
    setExpandedPageIds: (pageIds: Set<number>) => void;
    togglePageExpanded: (pageId: number) => void;
    expandPagePath: (page: IAdminPage, allPages: IAdminPage[]) => void;
}

export const useAdminStore = create<AdminState>()(
    persist(
        (set, get) => ({
            selectedKeyword: null,
            expandedPageIds: new Set<number>(),

            setSelectedKeyword: (keyword: string | null) => {
                set({ selectedKeyword: keyword });
            },

            setExpandedPageIds: (pageIds: Set<number>) => {
                set({ expandedPageIds: pageIds });
            },

            togglePageExpanded: (pageId: number) => {
                const { expandedPageIds } = get();
                const newSet = new Set(expandedPageIds);
                if (newSet.has(pageId)) {
                    newSet.delete(pageId);
                } else {
                    newSet.add(pageId);
                }
                set({ expandedPageIds: newSet });
            },

            expandPagePath: (page: IAdminPage, allPages: IAdminPage[]) => {
                const { expandedPageIds } = get();
                const newSet = new Set(expandedPageIds);

                const pathToExpand: number[] = [];
                let currentPage = page;

                while (currentPage.parent !== null) {
                    const parentPage = allPages.find((p) => p.id_pages === currentPage.parent);
                    if (parentPage) {
                        pathToExpand.push(parentPage.id_pages);
                        currentPage = parentPage;
                    } else {
                        break;
                    }
                }

                pathToExpand.forEach((pageId) => newSet.add(pageId));

                if (pathToExpand.length > 0) {
                    set({ expandedPageIds: newSet });
                }
            },
        }),
        {
            name: 'admin-store',
            partialize: (state) => ({ expandedPageIds: Array.from(state.expandedPageIds) }),
            merge: (persistedState: any, currentState) => ({
                ...currentState,
                expandedPageIds: new Set(persistedState?.expandedPageIds || []),
            }),
        }
    )
);

export const useSelectedKeyword = (): string | null =>
    useAdminStore((state) => state.selectedKeyword);

export const useSetSelectedKeyword = () =>
    useAdminStore((state) => state.setSelectedKeyword);

export const useExpandedPageIds = (): Set<number> =>
    useAdminStore((state) => state.expandedPageIds);

export const useSetExpandedPageIds = () =>
    useAdminStore((state) => state.setExpandedPageIds);

export const useTogglePageExpanded = () =>
    useAdminStore((state) => state.togglePageExpanded);

export const useExpandPagePath = () =>
    useAdminStore((state) => state.expandPagePath);
