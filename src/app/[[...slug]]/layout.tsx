'use client';

import "../../globals.css";
import "@mantine/core/styles.css";
import { AppShell } from "@mantine/core";
import { WebsiteHeader } from "../components/website/WebsiteHeader";
import { WebsiteFooter } from "../components/website/WebsiteFooter";
import { DebugMenu } from "../components/common/debug";
import { useParams } from 'next/navigation';
import { usePageContentForLayout } from "../../hooks/usePageContentForLayout";
import { useLanguageContext } from "../contexts/LanguageContext";

export default function SlugLayout({ children }: { children: any }) {
    const { slug } = useParams();
    const keyword = Array.isArray(slug) ? slug.join('/') : slug || '';
    const { currentLanguage } = useLanguageContext();
    
    // Fetch page content to check if it's headless
    const { content: pageContent } = usePageContentForLayout(keyword, currentLanguage || undefined);
    const isHeadless = Boolean(pageContent?.page?.is_headless);

    return (
        <AppShell
            header={!isHeadless ? { height: 60 } : undefined}
            footer={!isHeadless ? { height: 'auto' } : undefined}
        >
            {!isHeadless && (
                <AppShell.Header>
                    <WebsiteHeader />
                </AppShell.Header>
            )}
            
            <AppShell.Main>
                {children}
            </AppShell.Main>
            
            {!isHeadless && (
                <AppShell.Footer>
                    <WebsiteFooter />
                </AppShell.Footer>
            )}
            
            <DebugMenu />
        </AppShell>
    );
}
