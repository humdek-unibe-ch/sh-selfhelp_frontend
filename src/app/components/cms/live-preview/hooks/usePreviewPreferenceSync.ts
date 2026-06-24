/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `usePreviewPreferenceSync` — THEME-only live sync between the web pane and the
 * mobile frame over the `@selfhelp/shared` postMessage bridge.
 *
 * Web → mobile: when the web pane's Mantine colour scheme changes (its header
 * ThemeToggle), relay it to the mobile frame. Mobile → web: a theme change the
 * frame reports is applied to the SAME Mantine scheme the web pane uses. A
 * loop guard (`lastSyncedPrefsRef`) swallows the echo of a value the other side
 * just sent.
 *
 * Language is deliberately NOT synced here — it is bound to the iframe URL and
 * applied via a remount (see `useMobilePreviewSession`), because pushing it over
 * the bridge looped the mobile's token-rotating, query-invalidating `setLanguage`
 * into an invalidation storm.
 *
 * @module components/cms/live-preview/hooks/usePreviewPreferenceSync
 */

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { MantineColorScheme } from '@mantine/core';
import {
    PREVIEW_BRIDGE_MESSAGE,
    arePreviewPreferencesEqual,
    isPreviewBridgeMessage,
    type IPreviewPreferences,
    type TPreviewBridgeMessage,
} from '@selfhelp/shared';
import { livePreviewThemePreferences } from '../livePreviewLayout';

export interface IUsePreviewPreferenceSyncOptions {
    previewActive: boolean;
    colorScheme: MantineColorScheme;
    setColorScheme: (value: MantineColorScheme) => void;
    mobileMessageOrigin: string | null;
    mobileIframeRef: RefObject<HTMLIFrameElement | null>;
}

export interface IUsePreviewPreferenceSyncResult {
    /** Push the shared theme down to the mobile frame (records the loop guard). */
    sendPreferencesMobile: (prefs: IPreviewPreferences) => void;
    /** Live snapshot of the web pane's prefs (read by the navigation READY push). */
    currentPrefsRef: RefObject<IPreviewPreferences>;
    /** Last prefs pushed to OR received from the mobile frame (loop guard). */
    lastSyncedPrefsRef: RefObject<IPreviewPreferences | null>;
}

export function usePreviewPreferenceSync(
    opts: IUsePreviewPreferenceSyncOptions,
): IUsePreviewPreferenceSyncResult {
    const { previewActive, colorScheme, setColorScheme, mobileMessageOrigin, mobileIframeRef } = opts;

    const lastSyncedPrefsRef = useRef<IPreviewPreferences | null>(null);
    const currentPrefsRef = useRef<IPreviewPreferences>(livePreviewThemePreferences('auto'));

    useEffect(() => {
        // Theme-only live sync. Language is bound to the iframe URL and changes via
        // a remount, so it is never pushed over the bridge.
        currentPrefsRef.current = livePreviewThemePreferences(colorScheme);
    }, [colorScheme]);

    // Push the shared THEME down to the mobile frame (no reload) and record it as
    // the last synced value so the frame's echoed PREFERENCES_CHANGED isn't bounced
    // back (loop guard). Language is NOT pushed — it is bound to the iframe URL.
    const sendPreferencesMobile = useCallback(
        (prefs: IPreviewPreferences) => {
            const win = mobileIframeRef.current?.contentWindow;
            if (!win || !mobileMessageOrigin) return;
            const themePrefs = livePreviewThemePreferences(prefs.colorScheme);
            lastSyncedPrefsRef.current = themePrefs;
            const message: TPreviewBridgeMessage = {
                type: PREVIEW_BRIDGE_MESSAGE.SET_PREFERENCES,
                preferences: themePrefs,
            };
            win.postMessage(message, mobileMessageOrigin);
        },
        [mobileMessageOrigin, mobileIframeRef],
    );

    // Web pane → mobile: when the web pane's THEME changes (its header ThemeToggle),
    // relay it to the mobile frame. The guard skips the echo of a value the mobile
    // just reported up.
    useEffect(() => {
        if (!previewActive) return;
        const prefs = livePreviewThemePreferences(colorScheme);
        if (arePreviewPreferencesEqual(lastSyncedPrefsRef.current, prefs)) return;
        sendPreferencesMobile(prefs);
    }, [colorScheme, previewActive, sendPreferencesMobile]);

    // Mobile → web pane: a THEME change reported BY the mobile frame is applied to
    // the SAME Mantine scheme the web pane uses, so the web pane follows. The guard
    // skips the echo of a value the shell just pushed down. Language is NOT adopted
    // from the mobile frame — it is driven one-way (web → mobile) via the mint.
    useEffect(() => {
        if (!previewActive) return undefined;
        const onPrefsMessage = (event: MessageEvent) => {
            if (event.origin !== mobileMessageOrigin) return;
            if (!isPreviewBridgeMessage(event.data)) return;
            if (event.data.type !== PREVIEW_BRIDGE_MESSAGE.PREFERENCES_CHANGED) return;
            if (event.data.source !== 'mobile') return;
            const prefs = event.data.preferences;
            if (arePreviewPreferencesEqual(lastSyncedPrefsRef.current, prefs)) return;
            lastSyncedPrefsRef.current = livePreviewThemePreferences(prefs.colorScheme);
            if (prefs.colorScheme !== colorScheme) setColorScheme(prefs.colorScheme);
        };
        window.addEventListener('message', onPrefsMessage);
        return () => window.removeEventListener('message', onPrefsMessage);
    }, [previewActive, mobileMessageOrigin, colorScheme, setColorScheme]);

    return { sendPreferencesMobile, currentPrefsRef, lastSyncedPrefsRef };
}
