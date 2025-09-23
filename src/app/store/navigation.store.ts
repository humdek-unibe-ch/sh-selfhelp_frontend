import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface NavigationItem {
    path: string;
    isOpen: boolean;
}

export interface NavigationState {
    openItems: string[];
    activeItem: string | null;
    breadcrumbs: NavigationItem[];
    setActiveItem: (path: string | null) => void;
    toggleItem: (itemPath: string) => void;
    setBreadcrumbs: (items: NavigationItem[]) => void;
    resetNavigation: () => void;
}

const initialState: Pick<NavigationState, 'openItems' | 'activeItem' | 'breadcrumbs'> = {
    openItems: [],
    activeItem: null,
    breadcrumbs: []
};

export const useNavigationStore = create<NavigationState>()(
    persist(
        (set) => ({
            ...initialState,
            setActiveItem: (path: string | null): void => {
                set(() => ({ activeItem: path }));
            },

            toggleItem: (itemPath: string): void => {
                set((state) => ({
                    openItems: state.openItems.includes(itemPath)
                        ? state.openItems.filter((item) => item !== itemPath)
                        : [...state.openItems, itemPath]
                }));
            },

            setBreadcrumbs: (items: NavigationItem[]): void => {
                set(() => ({ breadcrumbs: items }));
            },

            resetNavigation: (): void => {
                set(initialState);
            },
        }),
        {
            name: 'navigation-storage',
            storage: createJSONStorage(() => sessionStorage), // Use sessionStorage instead of localStorage
            partialize: (state) => ({ 
                openItems: state.openItems,
                activeItem: state.activeItem 
            })
        }
    )
);

// Type-safe selector hooks
export const useNavigationOpenItems = (): string[] => 
    useNavigationStore((state) => state.openItems);

export const useNavigationActiveItem = (): string | null => 
    useNavigationStore((state) => state.activeItem);

export const useNavigationBreadcrumbs = (): NavigationItem[] => 
    useNavigationStore((state) => state.breadcrumbs); 