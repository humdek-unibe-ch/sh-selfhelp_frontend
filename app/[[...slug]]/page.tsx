'use client';

import { useNavigation } from '@/hooks/useNavigation';
import { notFound } from 'next/navigation';
import { useEffect } from 'react';
import { Container } from '@mantine/core';
import BasicStyle from '@/components/styles/BasicStyle';
import { usePageContent } from '@/hooks/usePageContent';
import { PageContentProvider, usePageContentContext } from '@/contexts/PageContentContext';
import { useResource } from '@refinedev/core';

export default function DynamicPage() {
    const { resource } = useResource();
    const keyword = resource?.name || '';

    return (
        <PageContentProvider>
            <DynamicPageContent keyword={keyword} />
        </PageContentProvider>
    );
}

function DynamicPageContent({ keyword }: { keyword: string }) {
    const { content: queryContent, isLoading: pageLoading, isFetching: pageFetching, isSuccess: pageSuccess } = usePageContent(keyword);
    const { pageContent: contextContent } = usePageContentContext();
    const pageContent = contextContent || queryContent;

    const { routes, isLoading } = useNavigation();
    const currentPath = '/' + keyword;
    const route = routes.find(route => {
        // Replace dynamic parameters in route path with regex pattern
        const routePattern = route.path.replace(/\[([^\]]+)\]/g, '([^/]+)');
        const regex = new RegExp(`^${routePattern}$`);
        return regex.test(currentPath);
    });

    const isValid = !!route;

    useEffect(() => {
        if (!isLoading && routes.length > 0 && !isValid) {
            notFound();
        }
    }, [routes, isValid, isLoading]);

    if (pageLoading) {
        return <div>Loading...</div>;
    }

    if (!isValid) {
        return <div>Error loading page content</div>;
    }

    if (!pageContent) {
        return <div>No content found</div>;
    }

    return (
        <Container size="md">
            {pageContent.content.map((style, index) => (
                style ? <BasicStyle key={index} style={style} /> : null
            ))}
        </Container>
    );
}
