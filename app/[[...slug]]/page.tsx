'use client';

import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/useNavigation';
import { notFound } from 'next/navigation';
import { useEffect } from 'react';
import { Container } from '@mantine/core';
import BasicStyle from '@/components/styles/BasicStyle';
import { usePageContent } from '@/hooks/usePageContent';
import { PageContentProvider, usePageContentContext } from '@/contexts/PageContentContext';
import { PageService } from '@/services/page.service';

export default function DynamicPage() {
    const params = useParams();
    const keyword = Array.isArray(params.slug) ? params.slug.join('/') : params.slug || '';
    /** Update page keyword when slug changes */
    useEffect(() => {
        PageService.setKeyword(keyword);
    }, [keyword]);

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
    const isValid = routes?.some(route => route.path === `/${keyword}`);

    useEffect(() => {
        if (!isLoading && routes.length > 0) {
            const isValidRoute = routes.some(route => route.path === currentPath);
            if (!isValidRoute) {
                notFound();
            }
        }
    }, [routes, currentPath, isLoading]);

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
