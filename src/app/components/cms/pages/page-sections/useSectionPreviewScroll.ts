/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * useSectionPreviewScroll — scroll a rendered section's `#section-{id}` anchor
 * into view inside a preview surface and pulse a highlight ring in the section's
 * OWN style accent colour.
 *
 * The public renderer wraps every section in `#section-{id}`, but the render is
 * async (React Query hydration), so we poll briefly for the anchor rather than
 * assuming it is present on the first frame. Used by the floating companion
 * preview pane so the "follow the selected section" behaviour lives in one place.
 *
 * @module components/cms/pages/page-sections/useSectionPreviewScroll
 */

import { useEffect, type RefObject } from 'react';

/** Highlight dwell time — long enough to catch the eye, short enough not to linger. */
const HIGHLIGHT_MS = 2200;
/** Poll cadence + budget while the async public render settles. */
const POLL_MS = 150;
const MAX_ATTEMPTS = 40; // ~6s — covers a slow content fetch

interface IUseSectionPreviewScrollArgs {
    /** Container the rendered page lives in (query scope for the anchor). */
    rootRef: RefObject<HTMLElement | null>;
    /** Section to scroll to + highlight, or null when nothing is targeted. */
    sectionId: number | null;
    /** Whether the preview surface is currently showing (skip work when hidden). */
    active: boolean;
    /**
     * Unique HSL hue (0–359) of the section's style. The highlight ring is drawn
     * from this hue (fixed S/L) so the pane matches the tree row's colour.
     */
    accentHue: number;
    /** CSS-module class applied for the highlight pulse animation. */
    highlightClass: string;
}

export function useSectionPreviewScroll({
    rootRef,
    sectionId,
    active,
    accentHue,
    highlightClass,
}: IUseSectionPreviewScrollArgs): void {
    useEffect(() => {
        if (!active || sectionId == null) return undefined;

        let cancelled = false;
        let highlightTimer: ReturnType<typeof setTimeout> | undefined;
        let pollTimer: ReturnType<typeof setTimeout> | undefined;
        let attempts = 0;
        let highlighted: HTMLElement | null = null;

        const clearHighlight = () => {
            if (highlighted) {
                highlighted.classList.remove(highlightClass);
                highlighted.style.removeProperty('--section-preview-accent');
                highlighted = null;
            }
        };

        const tryScroll = () => {
            if (cancelled) return;
            const target = rootRef.current?.querySelector<HTMLElement>(`#section-${sectionId}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Drive the ring colour from the section's own unique hue so the
                // pane highlight matches the tree row's colour.
                target.style.setProperty(
                    '--section-preview-accent',
                    `hsl(${accentHue} 65% 50%)`,
                );
                target.classList.add(highlightClass);
                highlighted = target;
                highlightTimer = setTimeout(clearHighlight, HIGHLIGHT_MS);
                return;
            }
            attempts += 1;
            if (attempts < MAX_ATTEMPTS) {
                pollTimer = setTimeout(tryScroll, POLL_MS);
            }
        };

        // Give the layout a beat before the first look-up.
        pollTimer = setTimeout(tryScroll, 200);

        return () => {
            cancelled = true;
            if (pollTimer) clearTimeout(pollTimer);
            if (highlightTimer) clearTimeout(highlightTimer);
            clearHighlight();
        };
    }, [active, sectionId, accentHue, highlightClass, rootRef]);
}
