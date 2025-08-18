'use client';

import { useEffect } from 'react';
import { PageContentRenderer } from './PageContentRenderer';
import { PageContentProvider, usePageContentContext } from '../../contexts/PageContentContext';
import { usePageContent } from '../../../hooks/usePageContent';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { IPageContent } from '../../../types/responses/frontend/frontend.types';
import { TStyle } from '../../../types/common/styles.types';

interface IPageContentRendererClientProps {
    sections: TStyle[];
    initialPageContent: IPageContent | null;
    keyword: string;
}

function PageContentRendererInner({ sections, initialPageContent, keyword }: IPageContentRendererClientProps) {
    const { setPageContent } = usePageContentContext();
    const { currentLanguageId, isUpdatingLanguage } = useLanguageContext();
    
    // Use React Query hook with server-provided initial data
    const { content: queryContent, isFetching } = usePageContent(keyword);
    
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
            <PageContentRenderer sections={pageContent?.sections || sections} />
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
