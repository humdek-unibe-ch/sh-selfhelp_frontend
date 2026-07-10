/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `usePreviewNavigationSync` — synchronized navigation between the web pane and
 * the mobile frame, with the shell as the canonical-page owner.
 *
 * Path → page resolution is owned by the shell (backend `/pages/resolve`).
 * This hook only relays soft navigate commands and applies the loop guard.
 *
 * Mobile sync rule: push `path` only when the canonical page has route params.
 * Static nested URLs sync by keyword so the frame keeps menu/modal navigation.
 *
 * @module components/cms/live-preview/hooks/usePreviewNavigationSync
 */

import { useCallback, useEffect, useRef, type RefObject, type MutableRefObject } from 'react';
import {
    PREVIEW_BRIDGE_MESSAGE,
    isPreviewBridgeMessage,
    type IPreviewPreferences,
    type TPreviewBridgeMessage,
} from '@selfhelp/shared';
export interface IUsePreviewNavigationSyncOptions {
    previewActive: boolean;
    mobileMessageOrigin: string | null;
    mobileIframeRef: RefObject<HTMLIFrameElement | null>;
    /** Canonical keyword ref (written here on a navigation in either pane). */
    currentKeywordRef: MutableRefObject<string | null>;
    /** Live web-pane prefs, pushed to the frame on its READY announce. */
    currentPrefsRef: RefObject<IPreviewPreferences>;
    /** Current public path — always sent on READY so the mobile frame can resolve parameterized routes. */
    previewPathRef?: RefObject<string | null>;
    /** Push the shared theme to the frame (from `usePreviewPreferenceSync`). */
    sendPreferencesMobile: (prefs: IPreviewPreferences) => void;
    /**
     * When the mobile frame reports a navigation, apply the same canonical
     * update (prefer `path` when present so parameterized routes stay hydrated).
     */
    onMobileNavigated: (keyword: string | null, path?: string | null) => void | Promise<void>;
}

export interface IUsePreviewNavigationSyncResult {
    /** Push a soft "navigate to keyword/path" to the mobile frame (no reload). */
    sendNavigateMobile: (keyword: string | null, path?: string | null) => void;
}

export function usePreviewNavigationSync(
    opts: IUsePreviewNavigationSyncOptions,
): IUsePreviewNavigationSyncResult {
    const {
        previewActive,
        mobileMessageOrigin,
        mobileIframeRef,
        currentKeywordRef,
        currentPrefsRef,
        previewPathRef,
        sendPreferencesMobile,
        onMobileNavigated,
    } = opts;

    const expectedRef = useRef<{ mobile: string | null | undefined }>({ mobile: undefined });

    const sendNavigateMobile = useCallback(
        (kw: string | null, path?: string | null) => {
            const win = mobileIframeRef.current?.contentWindow;
            if (!win || !mobileMessageOrigin) return;
            expectedRef.current.mobile = kw;
            const message: TPreviewBridgeMessage = {
                type: PREVIEW_BRIDGE_MESSAGE.NAVIGATE,
                keyword: kw,
                ...(path ? { path } : {}),
            };
            win.postMessage(message, mobileMessageOrigin);
        },
        [mobileMessageOrigin, mobileIframeRef],
    );

    useEffect(() => {
        if (!previewActive) return undefined;
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== mobileMessageOrigin) return;
            if (!isPreviewBridgeMessage(event.data)) return;
            const data = event.data;
            if (data.type === PREVIEW_BRIDGE_MESSAGE.READY) {
                // Always send the public path on READY — mobile calls
                // `navigateToResolvedPath` which does its own backend resolve,
                // so it can hydrate route_params from the path alone. Without
                // the path, keyword-only NAVIGATE for parameterized pages
                // (entry-record) opens an empty modal.
                sendNavigateMobile(
                    currentKeywordRef.current,
                    previewPathRef?.current ?? undefined,
                );
                sendPreferencesMobile(currentPrefsRef.current);
                return;
            }
            if (data.type !== PREVIEW_BRIDGE_MESSAGE.NAVIGATED) return;
            if (data.source !== 'mobile') return;

            if (expectedRef.current.mobile === data.keyword) {
                expectedRef.current.mobile = undefined;
                return;
            }
            if (data.keyword === currentKeywordRef.current && !data.path) return;

            void onMobileNavigated(data.keyword, data.path ?? null);
        };
        window.addEventListener('message', onMessage);
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [
        previewActive,
        mobileMessageOrigin,
        sendNavigateMobile,
        sendPreferencesMobile,
        currentKeywordRef,
        currentPrefsRef,
        previewPathRef,
        onMobileNavigated,
    ]);

    return { sendNavigateMobile };
}
