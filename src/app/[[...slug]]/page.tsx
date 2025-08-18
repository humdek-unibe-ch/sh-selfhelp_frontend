'use client';

import { notFound, useParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { Container, Loader, Center, Text } from '@mantine/core';
import { PageContentProvider, usePageContentContext } from '../contexts/PageContentContext';
import { usePageContent } from '../../hooks/usePageContent';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useLanguageContext } from '../contexts/LanguageContext';
import { PageContentRenderer } from '../components/website/PageContentRenderer';
import React from 'react';

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
                <DynamicPageContentOptimized keyword={keyword} />
            </Suspense>
        </PageContentProvider>
    );
}

const DynamicPageContentOptimized = React.memo(function DynamicPageContentOptimized({ keyword }: { keyword: string }) {
    const { currentLanguageId, isUpdatingLanguage } = useLanguageContext();
    
    const { content: queryContent, isLoading: pageLoading, isFetching: pageFetching } = usePageContent(keyword);
    const { pageContent: contextContent } = usePageContentContext();
    const pageContent = contextContent || queryContent;

    const { routes, isLoading: navLoading } = useAppNavigation();
    
    // Extract headless flag for rendering decisions
    const isHeadless = Boolean(pageContent?.is_headless);
    
    // Check if content is being updated (either loading or fetching)
    const isContentUpdating = pageLoading || pageFetching || isUpdatingLanguage;
    
    // Memoize navigation check
    const existsInNavigation = useMemo(() => 
        routes.some(p => p.keyword === keyword), 
        [routes, keyword]
    );
    
    // Check if page content is available (more reliable than navigation check)
    const hasValidContent = pageContent && pageContent.id;
    
    // Show minimal loading while data is loading
    if (pageLoading || navLoading) {
        return (
            <Center h="50vh">
                <Loader size="lg" />
            </Center>
        );
    }

    // Only show 404 if both navigation check fails AND no content is available
    if (!navLoading && routes.length > 0 && !existsInNavigation && !hasValidContent) {
        notFound();
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
    const sections = pageContent.sections || [];

    // For headless pages, render without standard container and let content fill the viewport
    if (isHeadless) {
        return (
            <div 
                style={{ minHeight: '100vh', width: '100%' }}
                className={`page-content-transition ${isContentUpdating ? 'page-content-loading' : ''}`}
                data-language-changing={isUpdatingLanguage}
            >
                <PageContentRenderer sections={sections} />
            </div>
        );
    }

    // For regular pages, use standard container layout
    return (
        <Container 
            size="xl" 
            py="md"
            className={`page-content-transition ${isContentUpdating ? 'page-content-loading' : ''}`}
            data-language-changing={isUpdatingLanguage}
        >
            <PageContentRenderer sections={sections} />
        </Container>
    );
});
