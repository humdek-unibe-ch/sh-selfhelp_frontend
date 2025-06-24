'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Container, Loader, Center, Text } from '@mantine/core';
import { PageContentProvider, usePageContentContext } from '../contexts/PageContentContext';
import { usePageContent } from '../../hooks/usePageContent';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useLanguageContext } from '../contexts/LanguageContext';
import { PageContentRenderer } from '../components/website/PageContentRenderer';
import { debug, info, warn } from '../../utils/debug-logger';

export default function DynamicPage() {
    const { slug } = useParams();
    const keyword = Array.isArray(slug) ? slug.join('/') : slug || '';

    return (
        <PageContentProvider>
            <Suspense fallback={
                <Center h="50vh">
                    <Loader size="lg" />
                </Center>
            }>
                <DynamicPageContent keyword={keyword} />
            </Suspense>
        </PageContentProvider>
    );
}

function DynamicPageContent({ keyword }: { keyword: string }) {
    const { currentLanguage, isLoading: languageLoading } = useLanguageContext();
    
    const { content: queryContent, isLoading: pageLoading } = usePageContent(keyword, currentLanguage || undefined);
    const { pageContent: contextContent } = usePageContentContext();
    const pageContent = contextContent || queryContent;

    const { routes, isLoading: navLoading } = useAppNavigation();
    
    // Extract headless flag for rendering decisions
    const isHeadless = Boolean(pageContent?.page?.is_headless);
    
    // Debug logging
    const debugInfo = {
        keyword,
        currentLanguage,
        languageLoading,
        routesCount: routes.length,
        routes: routes.map(r => ({ keyword: r.keyword, url: r.url, id: r.id_pages })),
        navLoading,
        pageLoading,
        hasContent: !!pageContent,
        pageData: pageContent?.page,
        sectionsCount: pageContent?.page?.sections?.length || 0,
        isHeadless
    };
    
    debug('Page render debug info', 'DynamicPageContent', debugInfo);
    
    // Check if page exists in navigation routes
    const existsInNavigation = routes.some(p => p.keyword === keyword);
    
    // Check if page content is available (more reliable than navigation check)
    const hasValidContent = pageContent && pageContent.page;
    
    info(`Page existence check: ${keyword}`, 'DynamicPageContent', { 
        keyword, 
        existsInNavigation, 
        hasValidContent,
        routesLength: routes.length 
    });
    
    // Show loading while data is loading
    if (pageLoading || navLoading || languageLoading) {
        return (
            <Center h="50vh">
                <Loader size="lg" />
            </Center>
        );
    }

    // Only show 404 if both navigation check fails AND no content is available
    // This prevents valid pages (like /styles) from showing 404 when they exist but aren't in navigation
    if (!navLoading && routes.length > 0 && !existsInNavigation && !hasValidContent) {
        warn('Page not found in navigation and no content available, redirecting to 404', 'DynamicPageContent', { keyword });
        notFound();
    }

    // If page doesn't exist in navigation but has content, show it anyway (like /styles)
    if (!existsInNavigation && hasValidContent) {
        info(`Page not in navigation but has content, rendering anyway: ${keyword}`, 'DynamicPageContent', { keyword });
    }

    if (!hasValidContent) {
        return (
            <Container size="md">
                <Center h="50vh">
                    <Text size="lg" c="dimmed">No content found</Text>
                </Center>
            </Container>
        );
    }

    // Extract sections from the page data
    const sections = pageContent.page.sections || [];

    // For headless pages, render without standard container and let content fill the viewport
    if (isHeadless) {
        return (
            <div style={{ minHeight: '100vh', width: '100%' }}>
                <PageContentRenderer sections={sections} />
            </div>
        );
    }

    // For regular pages, use standard container layout
    return (
        <Container size="xl" py="md">
            <PageContentRenderer sections={sections} />
        </Container>
    );
}
