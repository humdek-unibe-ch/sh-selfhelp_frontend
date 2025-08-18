'use client';

import "../../globals.css";
import '@mantine/dates/styles.css';
import "@mantine/core/styles.css";
import { AppShell } from "@mantine/core";
import { DebugMenu } from "../components/common/debug";
import { useParams } from 'next/navigation';
import { usePageContentForLayout } from "../../hooks/usePageContentForLayout";
import { WebsiteHeaderOptimized } from "../components/website/WebsiteHeaderOptimized";
import { WebsiteFooterOptimized } from "../components/website/WebsiteFooterOptimized";

export default function SlugLayout({ children }: { children: any }) {
    const { slug } = useParams();
    const keyword = Array.isArray(slug) ? slug.join('/') : slug || '';
    
    // Fetch page content to check if it's headless (with optimized caching)
    const { content: pageContent } = usePageContentForLayout(keyword);
    const isHeadless = Boolean(pageContent?.is_headless);

    return (
        <AppShell
            header={!isHeadless ? { height: 60 } : undefined}
        >
            {!isHeadless && (
                <AppShell.Header>
                    <WebsiteHeaderOptimized />
                </AppShell.Header>
            )}
            
            <AppShell.Main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>
                    {children}
                </div>
                {!isHeadless && <WebsiteFooterOptimized />}
            </AppShell.Main>
            
            <DebugMenu />
        </AppShell>
    );
}
