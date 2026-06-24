/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * PreviewShellBridge — the WEB half of the Live Preview bridge.
 *
 * Mounted in the public website shell (`SlugShell`), it stays DORMANT during
 * normal browsing and only activates when the page is embedded in the CMS
 * **Live Preview** shell — detected by the `previewShell=1` query param the
 * shell appends to the web iframe `src` (persisted in `sessionStorage` so it
 * survives in-app navigations that drop the query).
 *
 * When active it:
 *   - reports every in-app navigation up to the shell
 *     (`selfhelp-preview:navigated` with the page keyword + active locale), so
 *     the shell can drive the MOBILE frame to the same page;
 *   - accepts a `selfhelp-preview:navigate` command from the shell and performs
 *     a SOFT `router.push` (no reload) so the web frame follows the mobile one.
 *
 * Security: messages are only accepted from / sent to the shell origin handed in
 * via `parentOrigin` (same-origin for the web pane), never `'*'`; foreign /
 * malformed messages are dropped by `isPreviewBridgeMessage`.
 *
 * @module components/cms/live-preview/PreviewShellBridge
 */

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    PREVIEW_BRIDGE_MESSAGE,
    PREVIEW_PARENT_ORIGIN_PARAM,
    PREVIEW_SHELL_PARAM,
    isPreviewBridgeMessage,
    previewKeywordFromPath,
    type TPreviewBridgeMessage,
} from '@selfhelp/shared';
import { useLanguageContext } from '../../contexts/LanguageContext';

/** sessionStorage keys — scoped to THIS iframe's browsing context. */
const SHELL_FLAG_KEY = 'sh_preview_shell';
const PARENT_ORIGIN_KEY = 'sh_preview_parent_origin';

function keywordToPath(keyword: string | null): string {
    if (!keyword) return '/';
    return `/${keyword.split('/').map((seg) => encodeURIComponent(seg)).join('/')}`;
}

export function PreviewShellBridge() {
    const pathname = usePathname();
    const router = useRouter();
    const { currentLanguageId, languages } = useLanguageContext();

    // Resolved once on mount: is this an embedded preview, and which shell
    // origin do we trust? Refs so the message listener (registered once) always
    // reads the latest without re-subscribing.
    const activeRef = useRef(false);
    const parentOriginRef = useRef<string | null>(null);

    const locale = languages.find((lang) => lang.id === currentLanguageId)?.locale ?? null;

    const postToParent = useCallback((message: TPreviewBridgeMessage) => {
        if (!activeRef.current) return;
        const parent = window.parent;
        if (!parent || parent === window) return;
        parent.postMessage(message, parentOriginRef.current ?? window.location.origin);
    }, []);

    // Activate (once): read the param, persist it, capture the shell origin, and
    // wire the inbound command listener.
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (window.parent === window) return undefined; // not embedded → never a preview frame

        const search = new URLSearchParams(window.location.search);
        let active = search.get(PREVIEW_SHELL_PARAM) === '1';
        try {
            if (active) window.sessionStorage.setItem(SHELL_FLAG_KEY, '1');
            else active = window.sessionStorage.getItem(SHELL_FLAG_KEY) === '1';
        } catch {
            /* sessionStorage unavailable — fall back to the param only. */
        }
        if (!active) return undefined;
        activeRef.current = true;

        const paramOrigin = search.get(PREVIEW_PARENT_ORIGIN_PARAM);
        let parentOrigin = paramOrigin && paramOrigin.trim() !== '' ? paramOrigin : null;
        try {
            if (parentOrigin) window.sessionStorage.setItem(PARENT_ORIGIN_KEY, parentOrigin);
            else parentOrigin = window.sessionStorage.getItem(PARENT_ORIGIN_KEY);
        } catch {
            /* ignore */
        }
        // Same-origin web pane: default to our own origin if none was passed.
        parentOriginRef.current = parentOrigin ?? window.location.origin;

        const onMessage = (event: MessageEvent) => {
            if (event.origin !== parentOriginRef.current) return;
            if (!isPreviewBridgeMessage(event.data)) return;
            if (event.data.type !== PREVIEW_BRIDGE_MESSAGE.NAVIGATE) return;
            const target = keywordToPath(event.data.keyword);
            // Skip if we're already there (the shell only sends real changes,
            // but this guards against a redundant command).
            if (target === window.location.pathname) return;
            router.push(target);
        };
        window.addEventListener('message', onMessage);

        postToParent({ type: PREVIEW_BRIDGE_MESSAGE.READY, source: 'web' });

        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [postToParent, router]);

    // Report each navigation (and locale change) to the shell.
    useEffect(() => {
        if (!activeRef.current) return;
        postToParent({
            type: PREVIEW_BRIDGE_MESSAGE.NAVIGATED,
            source: 'web',
            keyword: previewKeywordFromPath(pathname),
            href: `${window.location.pathname}${window.location.search}`,
            locale,
        });
    }, [pathname, locale, postToParent]);

    return null;
}
