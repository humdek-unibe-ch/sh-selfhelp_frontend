'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Container } from '@mantine/core';
import { PageContentProvider, usePageContentContext } from '../contexts/PageContentContext';
import { usePageContent } from '../../hooks/usePageContent';
import { useAppNavigation } from '../../hooks/useAppNavigation';

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

    const { pages, isLoading: navLoading } = useAppNavigation();
    // Find existence of page
    const exists = pages.some(p => p.keyword === keyword);
    useEffect(() => {
        if (!navLoading && pages.length > 0 && !exists) notFound();
    }, [pages, exists, navLoading]);

    if (pageLoading || navLoading) return <div>Loading...</div>;

    if (!exists) return <div>Error loading page</div>;

    if (!pageContent) return <div>No content found</div>;

    return (
        <Container size="md">
            TODO load page content
        </Container>
    );
}
