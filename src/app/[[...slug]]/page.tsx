'use client';

import { notFound, useParams, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Container, Loader, Center, Text } from '@mantine/core';
import { PageContentProvider, usePageContentContext } from '../contexts/PageContentContext';
import { usePageContent } from '../../hooks/usePageContent';
import { useAppNavigation } from '../../hooks/useAppNavigation';
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
    const searchParams = useSearchParams();
    const languageParam = searchParams.get('language');
    
    // Use the language parameter if provided, otherwise undefined to let backend use default
    const language = languageParam || undefined;
    
    const { content: queryContent, isLoading: pageLoading } = usePageContent(keyword, language);
    const { pageContent: contextContent } = usePageContentContext();
    const pageContent = contextContent || queryContent;

    const { routes, isLoading: navLoading } = useAppNavigation();
    
    // Debug logging
    const debugInfo = {
        keyword,
        languageParam,
        language,
        routesCount: routes.length,
        routes: routes.map(r => ({ keyword: r.keyword, url: r.url, id: r.id_pages })),
        navLoading,
        pageLoading,
        hasContent: !!pageContent,
        contentSections: pageContent?.content?.length || 0
    };
    
    debug('Page render debug info', 'DynamicPageContent', debugInfo);
    
    // Find existence of page
    const exists = routes.some(p => p.keyword === keyword);
    
    info(`Page exists check: ${keyword}`, 'DynamicPageContent', { 
        keyword, 
        exists, 
        routesLength: routes.length 
    });
    
    useEffect(() => {
        if (!navLoading && routes.length > 0 && !exists) {
            warn('Page not found, redirecting to 404', 'DynamicPageContent', { keyword });
            notFound();
        }
    }, [routes, exists, navLoading, keyword]);

    if (pageLoading || navLoading) {
        return (
            <Center h="50vh">
                <Loader size="lg" />
            </Center>
        );
    }

    if (!exists) {
        return (
            <Container size="md">
                <Center h="50vh">
                    <Text size="lg" c="red">Error: Page not found in routes</Text>
                </Center>
            </Container>
        );
    }

    if (!pageContent) {
        return (
            <Container size="md">
                <Center h="50vh">
                    <Text size="lg" c="dimmed">No content found</Text>
                </Center>
            </Container>
        );
    }

    return (
        <Container size="xl">
            {pageContent.title && (
                <Text size="xl" fw={700} mb="lg">{pageContent.title}</Text>
            )}
            {pageContent.description && (
                <Text size="md" c="dimmed" mb="xl">{pageContent.description}</Text>
            )}
            <PageContentRenderer content={pageContent.content} />
        </Container>
    );
}
