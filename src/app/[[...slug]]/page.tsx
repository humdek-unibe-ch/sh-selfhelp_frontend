'use client';

import { notFound, useParams } from 'next/navigation';
import { Suspense, useMemo, useEffect } from 'react';
import { Container, Loader, Center, Text } from '@mantine/core';
import { PageContentProvider, usePageContentContext } from '../components/contexts/PageContentContext';
import { usePageContent } from '../../hooks/usePageContent';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useNavigationRefresh } from '../../hooks/useNavigationRefresh';
import { useLanguageContext } from '../components/contexts/LanguageContext';
import { PageContentRenderer } from '../components/frontend/content/PageContentRenderer';
import { usePreviewMode } from '../../hooks/usePreviewMode';
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
                <DynamicPageContent keyword={keyword} />
            </Suspense>
        </PageContentProvider>
    );
}

const DynamicPageContent = React.memo(function DynamicPageContent({ keyword }: { keyword: string }) {
    const { currentLanguageId, isUpdatingLanguage } = useLanguageContext();
    const { refreshOnPageChange } = useNavigationRefresh();
    const { isPreviewMode } = usePreviewMode();

    const { routes, isLoading: navLoading, isFetching: navFetching } = useAppNavigation();
    
    // Convert keyword to pageId using navigation data
    const pageId: number | null = useMemo(() => {
        if (!keyword || routes.length === 0) return null;

        // First try exact keyword match
        const exactMatch = routes.find(p => p.keyword === keyword);
        if (exactMatch) {
            return exactMatch.id_pages ?? null;
        }

        // Try URL pattern matching for dynamic routes
        const keywordPath = `/${keyword}`;
        const patternMatch = routes.find(page => {
            if (!page.url) return false;

            // Convert URL pattern to regex
            // e.g., "/validate/[i:uid]/[a:token]" -> "/validate/[^/]+/[^/]+"
            const pattern = page.url
                .replace(/\[i:[^\]]+\]/g, '[^/]+')  // integer parameters
                .replace(/\[a:[^\]]+\]/g, '[^/]+')  // alphanumeric parameters
                .replace(/\[s:[^\]]+\]/g, '[^/]+'); // string parameters

            const regex = new RegExp(`^${pattern}$`);
            return regex.test(keywordPath);
        });

        return patternMatch?.id_pages ?? null;
    }, [keyword, routes]);
    
    const { content: queryContent, isLoading: pageLoading, isFetching: pageFetching, isPlaceholderData } = usePageContent(pageId, { preview: isPreviewMode });
    const { pageContent: contextContent, clearPageContent, setPageContent } = usePageContentContext();
    
    // Use React Query data as primary source, context as fallback for immediate display
    const pageContent = queryContent || contextContent;
    
    // Refresh navigation when page changes (but don't clear content immediately)
    useEffect(() => {
        if (keyword) {
            // Refresh navigation to ensure user sees updated navigation
            refreshOnPageChange();
        }
    }, [keyword, refreshOnPageChange]);
    
    // Update context when new query data arrives, but keep previous data during transitions
    useEffect(() => {
        if (queryContent) {
            setPageContent(queryContent);
        }
    }, [queryContent, setPageContent]);
    
    // Extract headless flag for rendering decisions
    const isHeadless = Boolean(pageContent?.is_headless);
    
    // Check if content is being updated (either loading or fetching)
    const isContentUpdating = pageFetching || isUpdatingLanguage;
    
    // Memoize navigation check
    const existsInNavigation = useMemo(() => {
        // First check for exact keyword match
        if (routes.some(p => p.keyword === keyword)) {
            return true;
        }

        // Check URL pattern matching for dynamic routes
        const keywordPath = `/${keyword}`;
        return routes.some(page => {
            if (!page.url) return false;

            // Convert URL pattern to regex
            const pattern = page.url
                .replace(/\[i:[^\]]+\]/g, '[^/]+')  // integer parameters
                .replace(/\[a:[^\]]+\]/g, '[^/]+')  // alphanumeric parameters
                .replace(/\[s:[^\]]+\]/g, '[^/]+'); // string parameters

            const regex = new RegExp(`^${pattern}$`);
            return regex.test(keywordPath);
        });
    }, [routes, keyword]);
    
    // Check if page content is available (more reliable than navigation check)
    const hasValidContent = pageContent && pageContent.id;
    
    // Show loading spinner only on initial load when absolutely no data exists
    // This prevents annoying loading spinners when navigating between pages
    const showLoadingSpinner = (
        // Show spinner only if we're loading AND have no content at all
        (pageLoading && !pageContent && !isPlaceholderData) || 
        // OR if navigation is loading and we have no routes at all
        (navLoading && routes.length === 0)
    );
    
    if (showLoadingSpinner) {
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
                className={`min-h-screen w-full page-content-transition ${isContentUpdating ? 'page-content-loading' : ''}`}
                data-language-changing={isUpdatingLanguage}
            >
                <PageContentRenderer sections={sections as any} />
            </div>
        );
    }

    // For regular pages, use standard container layout
    return (
        <div
            data-language-changing={isUpdatingLanguage}
        >
            <PageContentRenderer sections={sections as any} />
        </div>
    );
});
