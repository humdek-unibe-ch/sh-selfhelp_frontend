/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `usePreviewUrlMirror` — mirror the canonical preview page into the shell's
 * own address bar WITHOUT a Next navigation (history API only, so `LivePreview`
 * never remounts).
 *
 * Format:
 *   `/admin/preview/<keyword>`
 *   `/admin/preview/<keyword>?path=/demo-team-members/team-members/4`
 *
 * The optional `path` query carries the public CMS URL (including route params
 * like `record_id`). Keyword alone cannot reload a parameterized entry-record
 * page — without `?path=` a refresh shows empty placeholders.
 *
 * @module components/cms/live-preview/hooks/usePreviewUrlMirror
 */

import { useEffect } from 'react';

/** Query key for the public CMS path mirrored into the Live Preview address bar. */
export const LIVE_PREVIEW_PATH_QUERY = 'path';

/**
 * Build the Live Preview shell href for a keyword + optional public path.
 * Preserves unrelated search params (e.g. `modal`) and drops `path` when unset.
 */
export function buildLivePreviewShellHref(
    keyword: string | null,
    publicPath: string | null | undefined,
    currentSearch = '',
): string {
    const kw = keyword?.trim() ? keyword.trim().replace(/^\/+/, '') : '';
    const pathname =
        kw === ''
            ? '/admin/preview'
            : `/admin/preview/${kw.split('/').map((seg) => encodeURIComponent(seg)).join('/')}`;

    const params = new URLSearchParams(
        currentSearch.startsWith('?') ? currentSearch.slice(1) : currentSearch,
    );
    params.delete(LIVE_PREVIEW_PATH_QUERY);

    const normalized =
        publicPath && publicPath.trim() !== ''
            ? publicPath.trim().replace(/\/+$/, '') || '/'
            : null;
    if (normalized && normalized !== '/') {
        params.set(LIVE_PREVIEW_PATH_QUERY, normalized);
    }

    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
}

export function usePreviewUrlMirror(
    currentKeyword: string | null,
    publicPath?: string | null,
): void {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const nextPathAndQuery = buildLivePreviewShellHref(
            currentKeyword,
            publicPath,
            window.location.search,
        );
        const next = `${nextPathAndQuery}${window.location.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (next !== current) {
            window.history.replaceState(window.history.state, '', next);
        }
    }, [currentKeyword, publicPath]);
}
