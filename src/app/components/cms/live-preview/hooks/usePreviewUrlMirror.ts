/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `usePreviewUrlMirror` — mirror the canonical preview keyword into the shell's
 * own address bar (`/admin/preview/<keyword>`), WITHOUT a Next navigation
 * (history API only, so `LivePreview` never remounts).
 *
 * Makes a manual reload restart at the page you navigated to, and the URL
 * shareable — in BOTH directions (web in-pane nav AND mobile-reported nav both
 * update `currentKeyword`).
 *
 * @module components/cms/live-preview/hooks/usePreviewUrlMirror
 */

import { useEffect } from 'react';

export function usePreviewUrlMirror(currentKeyword: string | null): void {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const kw = currentKeyword?.trim() ? currentKeyword.trim().replace(/^\/+/, '') : '';
        const path =
            kw === ''
                ? '/admin/preview'
                : `/admin/preview/${kw.split('/').map((seg) => encodeURIComponent(seg)).join('/')}`;
        const next = `${path}${window.location.search}${window.location.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (next !== current) {
            window.history.replaceState(window.history.state, '', next);
        }
    }, [currentKeyword]);
}
