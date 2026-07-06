/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import '../../../globals.css';
// Mantine **core** styles come from `globals.css` (the *layered*
// `@mantine/core/styles.layer.css`). Do NOT also import the unlayered
// `@mantine/core/styles.css` — unlayered rules beat `@layer utilities`, which
// breaks the CMS `css` escape hatch (Tailwind utilities can no longer override
// Mantine on Card/Paper-based styles).
import '@mantine/dates/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/tiptap/styles.css';
import { AppShell } from '@mantine/core';
import { isDoubleWebHeaderPreset, resolveWebHeaderPreset } from '@selfhelp/shared';
import { DebugMenu } from '../../components/shared/common/debug';
import { AdminEditCornerButton } from '../../components/shared/auth/AdminEditCornerButton';
import { PreviewModeIndicator } from '../../components/shared/common/PreviewModeIndicator';
import { WebStartupRedirect } from '../../components/frontend/navigation/WebStartupRedirect';
import { usePreviewMode } from '../../components/contexts/PreviewModeContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import styles from './SlugLayout.module.css';

/** Single-row header height (Mantine AppShell offset). */
const HEADER_HEIGHT = 60;
/** Two-row height for the double presets (top utility row + main nav row). */
const DOUBLE_HEADER_HEIGHT = 104;

interface ISlugShellProps {
    /**
     * Pre-computed on the server from the prefetched page payload. Drives
     * whether the header + footer render. Using a prop instead of a client
     * fetch avoids the old "show header, then hide" flash on headless pages.
     */
    isHeadless: boolean;
    /**
     * Server-resolved `web_header` preset so the very first paint already
     * reserves the correct header height (double presets need two rows).
     * Live preset switches take over once the client navigation query lands.
     */
    initialHeaderPreset?: string | null;
    /**
     * Server-rendered website header (`<WebsiteHeader />`). Passed as a
     * slot so the server-rendered menu HTML is part of the very first
     * painted frame — bypassing the old `'use client'` `WebsiteHeader`
     * import and the flash that came with it.
     *
     * Only rendered when `isHeadless === false`.
     */
    header?: React.ReactNode;
    /**
     * Server-rendered website footer. Same rationale as `header`.
     */
    footer?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Client shell that renders Mantine's AppShell around the slug page content.
 *
 * The server layout decides `isHeadless` based on the prefetched page, so
 * the shell layout is stable across the very first paint — no flash from
 * the default container shape to the headless one.
 *
 * Header + footer are passed as Server-Component slots so their HTML
 * (including the navigation menu) is already in the SSR response.
 */
export default function SlugShell({
    isHeadless,
    initialHeaderPreset = null,
    header,
    footer,
    children,
}: ISlugShellProps) {
    const { isPreviewMode } = usePreviewMode();
    // Double header presets render two rows (top utility row + main nav), so
    // the AppShell offset must grow with them or the page content hides the
    // second row and the header links overlap the hero.
    const { headerMenu } = useAppNavigation();
    const preset = headerMenu?.preset ?? initialHeaderPreset;
    const isDouble = isDoubleWebHeaderPreset(resolveWebHeaderPreset(preset));
    const headerHeight = isDouble ? DOUBLE_HEADER_HEIGHT : HEADER_HEIGHT;

    return (
        <AppShell header={!isHeadless ? { height: headerHeight } : undefined}>
            {!isHeadless && header && (
                <AppShell.Header>
                    {header}
                </AppShell.Header>
            )}

            <AppShell.Main className={styles.mainLayout}>
                <WebStartupRedirect />
                {isPreviewMode && <PreviewModeIndicator />}
                <div className={styles.contentArea}>{children}</div>

                {!isHeadless && footer && (
                    <div className={styles.footerWrapper}>
                        {footer}
                    </div>
                )}
            </AppShell.Main>

            <DebugMenu />
            <AdminEditCornerButton />
        </AppShell>
    );
}
