'use client';

import { useEffect } from 'react';

/**
 * Keep `document.title` and the `<meta name="description">` tag in sync with
 * client-side content updates (most notably language switches).
 *
 * ## Why this exists
 * The public slug route renders its `<title>` / `<meta name="description">`
 * via Next.js `generateMetadata()`, which runs **only on the server**. On
 * first paint that is exactly what we want — the browser tab shows the real
 * translated title before React hydrates, no flicker. However, when the user
 * changes language without a full page reload, we invalidate the
 * `['page-by-keyword']` React Query cache and re-fetch the content in the
 * new language, but the `<title>` node that SSR produced stays whatever it
 * was. The user has to reload to see the new tab title.
 *
 * This hook closes that gap. It is intentionally passive:
 *   - It never runs on the server (`useEffect`), so SSR output is untouched.
 *   - It no-ops when `title` / `description` are empty, preserving whatever
 *     `generateMetadata()` already put on the page.
 *   - It updates the existing `<meta name="description">` node if Next's
 *     metadata system produced one, or inserts a fresh one otherwise.
 *
 * @param title       Translated page title from the content payload, or null.
 * @param description Translated page description, or null.
 */
export function useSyncDocumentMetadata(
    title: string | null | undefined,
    description: string | null | undefined,
): void {
    useEffect(() => {
        if (typeof document === 'undefined') return;

        if (title && title.trim() && document.title !== title) {
            document.title = title;
        }

        if (typeof description === 'string' && description.trim()) {
            let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('name', 'description');
                document.head.appendChild(tag);
            }
            if (tag.getAttribute('content') !== description) {
                tag.setAttribute('content', description);
            }

            // Keep OpenGraph in sync too — `generateMetadata()` emits it on
            // the server, so mirroring it on client updates keeps scrapers
            // that re-read the DOM (e.g. social previews in embedded views)
            // consistent after a language switch.
            const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
            if (ogDesc && ogDesc.getAttribute('content') !== description) {
                ogDesc.setAttribute('content', description);
            }
        }

        if (title && title.trim()) {
            const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
            if (ogTitle && ogTitle.getAttribute('content') !== title) {
                ogTitle.setAttribute('content', title);
            }
        }
    }, [title, description]);
}
