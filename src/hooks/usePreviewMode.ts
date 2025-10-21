/**
 * Custom hook for managing preview mode state in localStorage.
 * Provides functionality to enable/disable preview mode for CMS pages.
 *
 * @module hooks/usePreviewMode
 */

import { useState, useEffect, useCallback } from 'react';

const PREVIEW_MODE_KEY = 'cms-preview-mode';

/**
 * Hook for managing preview mode state in localStorage.
 * When enabled, all pages will be served with preview=true and be dynamic.
 *
 * @returns {Object} Preview mode state and controls
 */
export function usePreviewMode() {
    const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

    // Load preview mode from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(PREVIEW_MODE_KEY);
        if (stored !== null) {
            setIsPreviewMode(JSON.parse(stored));
        }
    }, []);

    // Save to localStorage when state changes
    const togglePreviewMode = useCallback(() => {
        setIsPreviewMode(prev => {
            const newValue = !prev;
            localStorage.setItem(PREVIEW_MODE_KEY, JSON.stringify(newValue));
            return newValue;
        });
    }, []);

    const enablePreviewMode = useCallback(() => {
        setIsPreviewMode(true);
        localStorage.setItem(PREVIEW_MODE_KEY, JSON.stringify(true));
    }, []);

    const disablePreviewMode = useCallback(() => {
        setIsPreviewMode(false);
        localStorage.setItem(PREVIEW_MODE_KEY, JSON.stringify(false));
    }, []);

    return {
        isPreviewMode,
        togglePreviewMode,
        enablePreviewMode,
        disablePreviewMode
    };
}
