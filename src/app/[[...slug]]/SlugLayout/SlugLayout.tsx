'use client';

import "../../../globals.css";
import '@mantine/dates/styles.css';
import "@mantine/core/styles.css";
import '@mantine/carousel/styles.css';
import '@mantine/tiptap/styles.css';
import { AppShell } from "@mantine/core";
import { DebugMenu } from "../../components/shared/common/debug";
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { usePageContent } from "../../../hooks/usePageContent";
import { useAppNavigation } from "../../../hooks/useAppNavigation";
import { WebsiteHeader } from "../../components/frontend/layout/WebsiteHeader";
import styles from './SlugLayout.module.css';
import { WebsiteFooter } from "../../components";
import { PreviewModeIndicator } from "../../components/shared/common/PreviewModeIndicator";
import { usePreviewMode } from "../../../hooks/usePreviewMode";

export default function SlugLayout({ children }: { children: any }) {
    const { slug } = useParams();
    const keyword = Array.isArray(slug) ? slug.join('/') : slug || '';

    // Get navigation data to convert keyword to pageId
    const { routes } = useAppNavigation();
    const pageId = useMemo(() => {
        if (!keyword || routes.length === 0) return null;
        const page = routes.find(p => p.keyword === keyword);
        return page?.id_pages || null;
    }, [keyword, routes]);

    // Fetch page content to check if it's headless (with optimized caching)
    const { content: pageContent } = usePageContent(pageId, { forLayout: true });
    const isHeadless = Boolean(pageContent?.is_headless);
    const { isPreviewMode } = usePreviewMode();

    return (
        <AppShell
            header={!isHeadless ? { height: 60 } : undefined}
        >
        {!isHeadless && (
            <AppShell.Header>
                <WebsiteHeader />
            </AppShell.Header>
        )}

            <AppShell.Main className={styles.mainLayout}>
            {isPreviewMode && <PreviewModeIndicator />}
                <div className={styles.contentArea}>
                    {children}
                </div>

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
