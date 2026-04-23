import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global UI state — the pieces of ephemeral, cross-component UI state that
 * don't belong in React Query (which owns *server* state) and shouldn't be
 * duplicated into per-component `useState` hooks.
 *
 * Keep this store intentionally small. If a value can be derived from a
 * React Query cache entry (e.g. a selected page object) look it up with a
 * narrow `select` instead of mirroring it here.
 *
 * Tracked state:
 *  - `isPreviewMode`: whether the admin is previewing unpublished content.
 *    Replaces the old `usePreviewMode` hook that kept per-instance state in
 *    `useState` and synced via localStorage; having it in a store means
 *    toggling from the debug menu is picked up everywhere without a reload.
 *  - `isSidebarCollapsed`: desktop admin navbar collapsed state. Persists
 *    across navigations and page reloads so power users keep their chosen
 *    layout. Mobile burger toggle is independent of this flag (Mantine
 *    `AppShell` handles the mobile breakpoint natively).
 */
export interface UiState {
    isPreviewMode: boolean;
    setPreviewMode: (enabled: boolean) => void;
    togglePreviewMode: () => void;

    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebarCollapsed: () => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set, get) => ({
            isPreviewMode: false,
            setPreviewMode: (enabled: boolean) => set({ isPreviewMode: enabled }),
            togglePreviewMode: () => set({ isPreviewMode: !get().isPreviewMode }),

            isSidebarCollapsed: false,
            setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),
            toggleSidebarCollapsed: () =>
                set({ isSidebarCollapsed: !get().isSidebarCollapsed }),
        }),
        {
            name: 'ui-store',
            partialize: (state) => ({
                isPreviewMode: state.isPreviewMode,
                isSidebarCollapsed: state.isSidebarCollapsed,
            }),
        }
    )
);

export const useIsPreviewMode = (): boolean =>
    useUiStore((state) => state.isPreviewMode);

export const useSetPreviewMode = () =>
    useUiStore((state) => state.setPreviewMode);

export const useTogglePreviewMode = () =>
    useUiStore((state) => state.togglePreviewMode);

export const useIsSidebarCollapsed = (): boolean =>
    useUiStore((state) => state.isSidebarCollapsed);

export const useSetSidebarCollapsed = () =>
    useUiStore((state) => state.setSidebarCollapsed);

export const useToggleSidebarCollapsed = () =>
    useUiStore((state) => state.toggleSidebarCollapsed);
