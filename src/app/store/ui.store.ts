import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global UI state — ephemeral, cross-component UI state that doesn't belong
 * in React Query (which owns *server* state) and shouldn't be duplicated into
 * per-component `useState` hooks.
 *
 * Keep this store intentionally small. If a value can be derived from a React
 * Query cache entry (e.g. a selected page object) look it up with a narrow
 * `select` instead of mirroring it here.
 *
 * Preview mode lives in `PreviewModeContext` (cookie-backed, SSR-resolved)
 * rather than here — Zustand's `persist` rehydrates asynchronously, which
 * caused a "false → true" flip on every reload and an extra
 * `/pages/by-keyword/...` round-trip per admin page load.
 *
 * ## Tracked state
 *  - `isSidebarCollapsed`: desktop admin navbar collapsed state. Persists
 *    across navigations and page reloads so power users keep their chosen
 *    layout. Mobile burger toggle is independent of this flag (Mantine
 *    `AppShell` handles the mobile breakpoint natively).
 */
export interface UiState {
    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebarCollapsed: () => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set, get) => ({
            isSidebarCollapsed: false,
            setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),
            toggleSidebarCollapsed: () =>
                set({ isSidebarCollapsed: !get().isSidebarCollapsed }),
        }),
        {
            name: 'ui-store',
            partialize: (state) => ({
                isSidebarCollapsed: state.isSidebarCollapsed,
            }),
        }
    )
);

export const useIsSidebarCollapsed = (): boolean =>
    useUiStore((state) => state.isSidebarCollapsed);

export const useSetSidebarCollapsed = () =>
    useUiStore((state) => state.setSidebarCollapsed);

export const useToggleSidebarCollapsed = () =>
    useUiStore((state) => state.toggleSidebarCollapsed);
