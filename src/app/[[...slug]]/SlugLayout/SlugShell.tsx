'use client';

import '../../../globals.css';
import '@mantine/dates/styles.css';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/tiptap/styles.css';
import { AppShell } from '@mantine/core';
import { DebugMenu } from '../../components/shared/common/debug';
import { PreviewModeIndicator } from '../../components/shared/common/PreviewModeIndicator';
import { usePreviewMode } from '../../components/contexts/PreviewModeContext';
import styles from './SlugLayout.module.css';

interface ISlugShellProps {
    /**
     * Pre-computed on the server from the prefetched page payload. Drives
     * whether the header + footer render. Using a prop instead of a client
     * fetch avoids the old "show header, then hide" flash on headless pages.
     */
    isHeadless: boolean;
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
export default function SlugShell({ isHeadless, header, footer, children }: ISlugShellProps) {
    const { isPreviewMode } = usePreviewMode();

    return (
        <AppShell header={!isHeadless ? { height: 60 } : undefined}>
            {!isHeadless && header && (
                <AppShell.Header>
                    {header}
                </AppShell.Header>
            )}

            <AppShell.Main className={styles.mainLayout}>
                {isPreviewMode && <PreviewModeIndicator />}
                <div className={styles.contentArea}>{children}</div>

                {!isHeadless && footer && (
                    <div className={styles.footerWrapper}>
                        {footer}
                    </div>
                )}
            </AppShell.Main>

            <DebugMenu />
        </AppShell>
    );
}
