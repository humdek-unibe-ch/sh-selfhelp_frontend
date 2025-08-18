import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IAdminPage } from '../../types/responses/admin/admin.types';

export interface AdminState {
    selectedPage: IAdminPage | null;
    expandedPageIds: Set<number>;
    setSelectedPage: (page: IAdminPage | null) => void;
    clearSelectedPage: () => void;
    setExpandedPageIds: (pageIds: Set<number>) => void;
    togglePageExpanded: (pageId: number) => void;
    expandPagePath: (page: IAdminPage, allPages: IAdminPage[]) => void;
}

export const useAdminStore = create<AdminState>()(
    persist(
        (set, get) => ({
            selectedPage: null,
            expandedPageIds: new Set<number>(),
            
            setSelectedPage: (page: IAdminPage | null) => {
                set({ selectedPage: page });
            },
            
            clearSelectedPage: () => {
                set({ selectedPage: null });
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
                
                // Find the path to the page by walking up the parent chain
                const pathToExpand: number[] = [];
                let currentPage = page;
                
                while (currentPage.parent !== null) {
                    const parentPage = allPages.find(p => p.id_pages === currentPage.parent);
                    if (parentPage) {
                        pathToExpand.push(parentPage.id_pages);
                        currentPage = parentPage;
                    } else {
                        break;
                    }
                }
                
                // Expand all parents in the path
                pathToExpand.forEach(pageId => newSet.add(pageId));
                
                if (pathToExpand.length > 0) {
                    set({ expandedPageIds: newSet });
                }
            }
        }),
        {
            name: 'admin-store',
            // Only persist the expanded page IDs, not the selected page
            partialize: (state) => ({ expandedPageIds: Array.from(state.expandedPageIds) }),
            // Custom merge function to handle Set conversion
            merge: (persistedState: any, currentState) => ({
                ...currentState,
                expandedPageIds: new Set(persistedState?.expandedPageIds || [])
            })
        }
    )
);

// Type-safe selector hooks
export const useSelectedPage = (): IAdminPage | null => 
    useAdminStore((state) => state.selectedPage);

export const useSetSelectedPage = () => 
    useAdminStore((state) => state.setSelectedPage);

export const useClearSelectedPage = () => 
    useAdminStore((state) => state.clearSelectedPage);

export const useExpandedPageIds = (): Set<number> => 
    useAdminStore((state) => state.expandedPageIds);

export const useSetExpandedPageIds = () => 
    useAdminStore((state) => state.setExpandedPageIds);

export const useTogglePageExpanded = () => 
    useAdminStore((state) => state.togglePageExpanded);

export const useExpandPagePath = () => 
    useAdminStore((state) => state.expandPagePath); 