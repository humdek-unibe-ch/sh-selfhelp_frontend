'use client';

/**
 * `PreviewModeContext` — SSR-safe preview-mode state.
 *
 * Mirrors the `LanguageContext` pattern: the server resolves the flag from
 * the `sh_preview` cookie (via `resolvePreviewSSR`), threads it down as
 * `initialPreviewMode`, and this provider hands the same value to both the
 * SSR render and the first client render. That removes the Zustand-persist
 * rehydration race that previously:
 *
 *   1. Rendered the tree once with `isPreviewMode = false` (default),
 *   2. Flipped to the stored value after `persist`'s async rehydration,
 *   3. Caused `usePageContentByKeyword` to re-key from `'published'` to
 *      `'preview'` between the two renders → an extra
 *      `/pages/by-keyword/...` fetch on every page load in preview mode.
 *
 * The cookie is also written from `togglePreviewMode` so the next SSR
 * request reads the up-to-date value (no "changed preview here, reloaded,
 * got published content back" surprises).
 *
 * @module components/contexts/PreviewModeContext
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { writeBrowserCookie } from '../../../utils/auth.utils';
import { LONG_LIVED_COOKIE_MAX_AGE, PREVIEW_COOKIE } from '../../../config/cookie-names';

interface IPreviewModeContextValue {
    isPreviewMode: boolean;
    togglePreviewMode: () => void;
}

const PreviewModeContext = createContext<IPreviewModeContextValue | null>(null);

interface IPreviewModeProviderProps {
    children: ReactNode;
    /**
     * Preview flag resolved from the `sh_preview` cookie during SSR. Server
     * and client both start from this value so React hydration matches
     * exactly and the page-content query never re-keys on boot.
     */
    initialPreviewMode: boolean;
}

export function PreviewModeProvider({ children, initialPreviewMode }: IPreviewModeProviderProps) {
    const [isPreviewMode, setIsPreviewMode] = useState<boolean>(initialPreviewMode);

    const togglePreviewMode = useCallback(() => {
        setIsPreviewMode((prev) => {
            const next = !prev;
            writeBrowserCookie(
                PREVIEW_COOKIE,
                next ? '1' : '',
                next ? LONG_LIVED_COOKIE_MAX_AGE : 0
            );
            return next;
        });
    }, []);

    const value = useMemo<IPreviewModeContextValue>(
        () => ({ isPreviewMode, togglePreviewMode }),
        [isPreviewMode, togglePreviewMode]
    );

    return <PreviewModeContext.Provider value={value}>{children}</PreviewModeContext.Provider>;
}

/**
 * Read the current preview-mode value.
 */
export function usePreviewMode(): IPreviewModeContextValue {
    const ctx = useContext(PreviewModeContext);
    if (ctx) return ctx;
    throw new Error('usePreviewMode must be used inside PreviewModeProvider');
}
