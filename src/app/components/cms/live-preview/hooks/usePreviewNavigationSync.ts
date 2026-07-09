/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `usePreviewNavigationSync` — synchronized navigation between the web pane and
 * the mobile frame, with the shell as the canonical-page owner.
 *
 * - `handleWebNavigate(path)`: an intercepted in-pane web link/button makes the
 *   page canonical and pushes a SOFT navigate to the mobile frame (no reload).
 * - mobile READY → push the canonical page AND the current theme down so the
 *   frame syncs to wherever the web pane already is (web wins the initial sync).
 * - mobile NAVIGATED → make it canonical (re-renders the web pane + mirrors the
 *   URL), with a per-frame "expected keyword" loop guard that swallows the echo
 *   of a command this shell just pushed.
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
import { keywordFromPreviewPath } from '../utils/previewKeyword';

export interface IUsePreviewNavigationSyncOptions {
    previewActive: boolean;
    mobileMessageOrigin: string | null;
    mobileIframeRef: RefObject<HTMLIFrameElement | null>;
    /** Canonical keyword ref (written here on a navigation in either pane). */
    currentKeywordRef: MutableRefObject<string | null>;
    /** Set the canonical keyword state (re-renders the web pane + mirrors URL). */
    setCurrentKeyword: (keyword: string | null) => void;
    /** Live web-pane prefs, pushed to the frame on its READY announce. */
    currentPrefsRef: RefObject<IPreviewPreferences>;
    /** Current public path for parameterized routes (optional). */
    previewPathRef?: RefObject<string | null>;
    /** Push the shared theme to the frame (from `usePreviewPreferenceSync`). */
    sendPreferencesMobile: (prefs: IPreviewPreferences) => void;
    /**
     * Optional path→keyword resolver (defaults to `keywordFromPreviewPath`
     * without a page list). The shell passes one backed by the navigation
     * payload so nested page URLs map to their real CMS keyword.
     */
    resolveKeyword?: (path: string) => string | null;
}

export interface IUsePreviewNavigationSyncResult {
    /** Handle an intercepted in-pane web navigation. */
    handleWebNavigate: (path: string) => void;
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
        setCurrentKeyword,
        currentPrefsRef,
        previewPathRef,
        sendPreferencesMobile,
        resolveKeyword,
    } = opts;

    // Loop guard: when the shell pushes a NAVIGATE to the mobile frame it records
    // the keyword here; that frame's echoed NAVIGATED is then swallowed instead of
    // bounced back (no ping-pong).
    const expectedRef = useRef<{ mobile: string | null | undefined }>({ mobile: undefined });

    // Push a soft "navigate to keyword" to the mobile frame (no reload) and record
    // it as expected so its echoed NAVIGATED isn't bounced back (loop guard).
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

    // In-pane web navigation (intercepted links/buttons) → make it the canonical
    // page and drive the mobile frame to match.
    const handleWebNavigate = useCallback(
        (path: string) => {
            const kw = resolveKeyword ? resolveKeyword(path) : keywordFromPreviewPath(path);
            if (kw === currentKeywordRef.current) return;
            currentKeywordRef.current = kw;
            setCurrentKeyword(kw);
            sendNavigateMobile(kw);
        },
        [sendNavigateMobile, currentKeywordRef, setCurrentKeyword, resolveKeyword],
    );

    // Synchronized navigation FROM mobile: when the mobile frame reports it
    // navigated, make it the canonical page (which re-renders the inline web pane
    // and mirrors the URL). The loop guard stops our own pushed command's echo
    // from bouncing.
    useEffect(() => {
        if (!previewActive) return undefined;
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== mobileMessageOrigin) return;
            if (!isPreviewBridgeMessage(event.data)) return;
            const data = event.data;
            // The mobile frame announces READY after a (re)load → push the canonical
            // page AND the current theme so it syncs to wherever the web pane already
            // is (web pane wins the initial sync). Language is already baked into the
            // frame's URL at mint, so it isn't pushed here.
            if (data.type === PREVIEW_BRIDGE_MESSAGE.READY) {
                sendNavigateMobile(currentKeywordRef.current, previewPathRef?.current ?? null);
                sendPreferencesMobile(currentPrefsRef.current);
                return;
            }
            if (data.type !== PREVIEW_BRIDGE_MESSAGE.NAVIGATED) return;
            if (data.source !== 'mobile') return;

            // Echo of a command we pushed → consume + stop.
            if (expectedRef.current.mobile === data.keyword) {
                expectedRef.current.mobile = undefined;
                return;
            }
            // Already on this page (covers the initial boot echo) → no update.
            if (data.keyword === currentKeywordRef.current) return;

            currentKeywordRef.current = data.keyword;
            setCurrentKeyword(data.keyword);
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
        setCurrentKeyword,
        currentPrefsRef,
        previewPathRef,
    ]);

    return { handleWebNavigate, sendNavigateMobile };
}
