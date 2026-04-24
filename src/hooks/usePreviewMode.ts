/**
 * `usePreviewMode` — thin wrapper over the global `useUiStore` preview slice.
 *
 * Previously each caller held its own `useState(false)` and synchronised via
 * localStorage inside a `useEffect`. That meant:
 *   - Multiple consumers could temporarily disagree on the preview flag.
 *   - The first render always showed `false` on the server, then flipped on
 *     the client, causing a visible "Preview banner flashes off" hydration
 *     glitch.
 *
 * By delegating to a Zustand store (persisted to localStorage) every hook
 * consumer shares the same value and the store reads the persisted value
 * synchronously on first render, eliminating the flash.
 *
 * The public API is preserved so existing imports compile without changes.
 *
 * @module hooks/usePreviewMode
 */

import { useIsPreviewMode, useSetPreviewMode, useTogglePreviewMode } from '../app/store/ui.store';

export function usePreviewMode() {
    const isPreviewMode = useIsPreviewMode();
    const togglePreviewMode = useTogglePreviewMode();
    const setPreviewMode = useSetPreviewMode();

    return {
        isPreviewMode,
        togglePreviewMode,
        enablePreviewMode: () => setPreviewMode(true),
        disablePreviewMode: () => setPreviewMode(false),
    };
}
