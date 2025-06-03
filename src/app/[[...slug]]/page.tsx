'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Container, Loader, Center, Text } from '@mantine/core';
import { PageContentProvider, usePageContentContext } from '../contexts/PageContentContext';
import { usePageContent } from '../../hooks/usePageContent';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { debug, info, warn } from '../../utils/debug-logger';

export default function DynamicPage() {
    const { slug } = useParams();
    const keyword = Array.isArray(slug) ? slug.join('/') : slug || '';

    return (
        <PageContentProvider>
            <DynamicPageContent keyword={keyword} />
        </PageContentProvider>
    );
}

function DynamicPageContent({ keyword }: { keyword: string }) {
    const { content: queryContent, isLoading: pageLoading } = usePageContent(keyword);
    const { pageContent: contextContent } = usePageContentContext();
    const pageContent = contextContent || queryContent;

    const { routes, isLoading: navLoading } = useAppNavigation();
    
    // Debug logging
    const debugInfo = {
        keyword,
        routesCount: routes.length,
        routes: routes.map(r => ({ keyword: r.keyword, url: r.url, id: r.id_pages })),
        navLoading,
        pageLoading
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
        <Container size="md">
            <Text size="lg" fw={500} mb="md">Page: {keyword}</Text>
            <Text size="sm" c="dimmed">TODO: Load page content</Text>
        </Container>
    );
}
