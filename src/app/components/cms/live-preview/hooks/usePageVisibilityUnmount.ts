/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `usePageVisibilityUnmount` — track real tab visibility for the Live Preview.
 *
 * Returns `pageActive` (and a ref mirror) that follows `document.visibilityState`
 * ONLY: a hidden tab flips it false so the expensive mobile iframe can unmount
 * (and stop starving the Expo dev server), while a merely unfocused window
 * (DevTools, the IDE, another window) keeps it true — that was the old "DevTools
 * pauses the preview" bug. The remount-with-fresh-code on RESUME is owned by
 * `useMobilePreviewSession`, which reacts to `pageActive` going true again.
 *
 * @module components/cms/live-preview/hooks/usePageVisibilityUnmount
 */

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { isPreviewPageActive } from '../livePreviewLayout';

export interface IUsePageVisibilityUnmountResult {
    /** True while the tab is visible — gates mounting the mobile iframe. */
    pageActive: boolean;
    /** Ref mirror so non-reactive callers read the latest value without deps. */
    pageActiveRef: MutableRefObject<boolean>;
}

export function usePageVisibilityUnmount(): IUsePageVisibilityUnmountResult {
    const [pageActive, setPageActive] = useState(true);
    const pageActiveRef = useRef(true);

    useEffect(() => {
        const applyPageActive = (active: boolean) => {
            if (pageActiveRef.current === active) return;
            pageActiveRef.current = active;
            setPageActive(active);
        };

        const onVisibility = () => {
            applyPageActive(isPreviewPageActive({ visibilityState: document.visibilityState }));
        };

        onVisibility();
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    return { pageActive, pageActiveRef };
}
