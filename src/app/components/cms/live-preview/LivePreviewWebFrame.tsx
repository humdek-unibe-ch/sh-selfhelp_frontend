/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * LivePreviewWebFrame — the desktop (web) half of the Live Preview stage.
 *
 * A thin presentational wrapper that gives the inline `LivePreviewWebPane` the
 * remaining row width and remounts it on `webReloadKey`. The pane itself renders
 * the real public website (header menu + content + footer) inline (NOT an
 * iframe) via `DynamicPageClient`.
 *
 * @module components/cms/live-preview/LivePreviewWebFrame
 */

import { Box } from '@mantine/core';
import { LivePreviewWebPane } from './LivePreviewWebPane';

export interface ILivePreviewWebFrameProps {
    /** Bumping this remounts the inline web pane (a hard refresh). */
    webReloadKey: number;
    /** Canonical keyword the web pane renders. */
    keyword: string | null;
    /** Called when an intercepted in-pane link/button navigates. */
    onNavigate: (path: string) => void;
}

export function LivePreviewWebFrame({ webReloadKey, keyword, onNavigate }: ILivePreviewWebFrameProps) {
    return (
        <Box style={{ flex: 1, minWidth: 0 }}>
            <LivePreviewWebPane key={`web-${webReloadKey}`} keyword={keyword} onNavigate={onNavigate} />
        </Box>
    );
}
