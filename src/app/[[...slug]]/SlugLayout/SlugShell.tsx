'use client';

import '../../../globals.css';
import '@mantine/dates/styles.css';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/tiptap/styles.css';
import { AppShell } from '@mantine/core';
import { DebugMenu } from '../../components/shared/common/debug';
import { WebsiteHeader } from '../../components/frontend/layout/WebsiteHeader';
import { WebsiteFooter } from '../../components';
import { PreviewModeIndicator } from '../../components/shared/common/PreviewModeIndicator';
import { usePreviewMode } from '../../../hooks/usePreviewMode';
import styles from './SlugLayout.module.css';

interface ISlugShellProps {
    /**
     * Pre-computed on the server from the prefetched page payload. Drives
     * whether the header + footer render. Using a prop instead of a client
     * fetch avoids the old "show header, then hide" flash on headless pages.
     */
    isHeadless: boolean;
    children: React.ReactNode;
}

/**
 * Client shell that renders Mantine's AppShell around the slug page content.
 *
 * The server layout decides `isHeadless` based on the prefetched page, so
 * the shell layout is stable across the very first paint — no flash from
 * the default container shape to the headless one.
 */
export default function SlugShell({ isHeadless, children }: ISlugShellProps) {
    const { isPreviewMode } = usePreviewMode();

    return (
        <AppShell header={!isHeadless ? { height: 60 } : undefined}>
            {!isHeadless && (
                <AppShell.Header>
                    <WebsiteHeader />
                </AppShell.Header>
            )}

            <AppShell.Main className={styles.mainLayout}>
                {isPreviewMode && <PreviewModeIndicator />}
                <div className={styles.contentArea}>{children}</div>

                {!isHeadless && (
                    <div className={styles.footerWrapper}>
                        <WebsiteFooter />
                    </div>
                )}
            </AppShell.Main>

            <DebugMenu />
        </AppShell>
    );
}
