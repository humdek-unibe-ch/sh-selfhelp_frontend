/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * PreviewNavigationContext — keeps in-preview navigation INSIDE the Live
 * Preview surface.
 *
 * The CMS **Live Preview** renders the real public website inline (no iframe)
 * so the editor can browse every page side-by-side with the mobile frame. But
 * the rendered page's links/buttons normally drive the global Next router —
 * inside the preview that would navigate the whole admin app away from
 * `/admin/preview/...`. So the navigating style components
 * (`InternalLink`, `ButtonStyle`, `LinkStyle`) consult this context: when a
 * handler is present (i.e. they are rendered inside the preview pane) they call
 * it INSTEAD of `router.push` / following the `<a>`, handing the target path to
 * the shell which updates the canonical keyword, drives the mobile frame, and
 * mirrors the master URL.
 *
 * It is `null` everywhere else (normal browsing), so those components keep their
 * exact existing behaviour outside the preview — this is purely additive.
 *
 * @module components/cms/live-preview/PreviewNavigationContext
 */

import { createContext, useContext } from 'react';

export interface IPreviewNavigationValue {
    /**
     * Navigate the preview to an internal path (already origin-stripped, e.g.
     * `/impressum`, `/`). The shell maps it to a CMS keyword.
     */
    navigate: (path: string) => void;
}

const PreviewNavigationContext = createContext<IPreviewNavigationValue | null>(null);

export const PreviewNavigationProvider = PreviewNavigationContext.Provider;

/**
 * The active preview navigation handler, or `null` outside the Live Preview web
 * pane (in which case callers must fall back to their normal navigation).
 */
export function usePreviewNavigation(): IPreviewNavigationValue | null {
    return useContext(PreviewNavigationContext);
}

/**
 * Whether an (already origin-stripped) href is an internal CMS page path that
 * the preview should own. Admin app routes (`/admin/...`), protocol-relative
 * (`//host`), hash and external links are left to navigate normally.
 */
export function isPreviewInternalPath(path: string | null | undefined): path is string {
    if (!path) return false;
    if (!path.startsWith('/')) return false;
    if (path.startsWith('//')) return false;
    if (path === '/admin' || path.startsWith('/admin/')) return false;
    return true;
}

/**
 * Normalise a link `href` to a same-origin path, or `null` if it is external.
 * Handles absolute same-origin URLs (`http://host/x`) and strips nothing else.
 */
export function previewPathFromHref(href: string | null | undefined): string | null {
    if (!href) return null;
    const trimmed = href.trim();
    if (trimmed === '') return null;
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const url = new URL(trimmed);
            if (typeof window !== 'undefined' && url.origin !== window.location.origin) {
                return null; // external origin → not a preview navigation
            }
            return `${url.pathname}${url.search}`;
        } catch {
            return null;
        }
    }
    return trimmed;
}
