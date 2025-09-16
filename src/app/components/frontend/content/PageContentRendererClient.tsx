'use client';

import React, { useEffect, useMemo } from 'react';
import { usePageContent } from '../../../../hooks/usePageContent';
import { usePageContentContext, PageContentProvider } from '../../contexts/PageContentContext';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { PageContentRenderer } from './PageContentRenderer';
import type { IPageContent } from '../../../../types/responses/frontend/frontend.types';
import type { TStyle } from '../../../../types/common/styles.types';

interface IPageContentRendererClientProps {
    sections?: TStyle[];
    initialPageContent: IPageContent | null;
    keyword: string;
}

function PageContentRendererInner({ sections, initialPageContent, keyword }: IPageContentRendererClientProps) {
    const { setPageContent } = usePageContentContext();
    const { currentLanguageId, isUpdatingLanguage } = useLanguageContext();
    const { routes } = useAppNavigation();
    
    // Convert keyword to pageId using navigation data
    const pageId = useMemo(() => {
        if (!keyword || routes.length === 0) return null;
        const page = routes.find(p => p.keyword === keyword);
        return page?.id_pages || null;
    }, [keyword, routes]);
    
    // Use React Query hook with server-provided initial data
    const { content: queryContent, isFetching } = usePageContent(pageId);
    
    // Use server-provided data initially, then switch to React Query data
    const pageContent = queryContent || initialPageContent;
    
    // Update context with server-provided initial data
    useEffect(() => {
        if (initialPageContent) {
            setPageContent(initialPageContent);
        }
    }, [initialPageContent, setPageContent]);
    
    // Update context when React Query data changes
    useEffect(() => {
        if (queryContent) {
            setPageContent(queryContent);
        }
    }, [queryContent, setPageContent]);

    return (
        <div 
            className={`page-content-transition ${(isFetching || isUpdatingLanguage) ? 'page-content-loading' : ''}`}
            data-language-changing={isUpdatingLanguage}
        >
            <PageContentRenderer sections={(pageContent?.sections || sections || []) as TStyle[]} />
        </div>
    );
}

/**
 * Client Component wrapper for Page Content Rendering
 * Uses server-provided initial data and React Query for updates
 */
export function PageContentRendererClient(props: IPageContentRendererClientProps) {
    return (
        <PageContentProvider>
            <PageContentRendererInner {...props} />
        </PageContentProvider>
    );
}
