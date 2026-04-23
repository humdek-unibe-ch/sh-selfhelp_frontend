'use client';

import { useMemo } from 'react';
import { Container, Loader, Center, Text } from '@mantine/core';
import { useIsFetching } from '@tanstack/react-query';
import { useLanguageContext } from '../components/contexts/LanguageContext';
import { usePreviewMode } from '../../hooks/usePreviewMode';
import { usePageContentByKeyword } from '../../hooks/usePageContentByKeyword';
import { useSyncDocumentMetadata } from '../../hooks/useSyncDocumentMetadata';
import { PageContextProvider } from '../components/contexts/PageContext';
import { PageContentRenderer } from '../components';

interface IDynamicPageClientProps {
    keyword: string;
    /**
     * Page id resolved on the server. Used to seed the `PageContext` for
     * child style components that look up content via `usePageContentValue`.
     * The canonical content still lives in the `['page-by-keyword', ...]`
     * React Query cache that was hydrated by the slug layout.
     */
    initialPageId: number;
}

/**
 * Client-side renderer for slug pages.
 *
 * On first mount the `usePageContentByKeyword` cache entry has already been
 * dehydrated by the layout, so the very first render has real sections and
 * the real title. Subsequent navigations between slug pages rely on the
 * React Query cache + `keepPreviousData` so we never flash spinners between
 * transitions.
 */
export default function DynamicPageClient({ keyword, initialPageId }: IDynamicPageClientProps) {
    const { currentLanguageId } = useLanguageContext();
    const { isPreviewMode } = usePreviewMode();

    const {
        content: pageContent,
        isLoading,
        isFetching,
        isPlaceholderData,
    } = usePageContentByKeyword(keyword, { preview: isPreviewMode });

    // React Query is the single source of truth for "language change in
    // flight": a language switch invalidates `page-by-keyword`, which
    // surfaces here as `useIsFetching` > 0.
    const pendingLangFetches = useIsFetching({ queryKey: ['page-by-keyword'] });
    const isLanguageChanging = pendingLangFetches > 0;

    const pageId = pageContent?.id ?? initialPageId;
    const isHeadless = Boolean(pageContent?.is_headless);
    const isContentUpdating = isFetching || isLanguageChanging;
    const sections = useMemo(() => pageContent?.sections ?? [], [pageContent]);

    // SSR `generateMetadata()` paints the correct tab title on first load.
    // After that, language switches refresh the content via React Query but
    // leave the server-rendered `<title>` / description untouched — this
    // hook keeps them in sync without requiring a full reload.
    useSyncDocumentMetadata(pageContent?.title ?? null, pageContent?.description ?? null);

    if (isLoading && !pageContent && !isPlaceholderData) {
        return (
            <Center h="50vh">
                <Loader size="lg" />
            </Center>
        );
    }

    if (!pageContent) {
        return (
            <Container size="md">
                <Center h="50vh">
                    <Text size="lg" c="dimmed">
                        No content found
                    </Text>
                </Center>
            </Container>
        );
    }

    const rendered = (
        <PageContextProvider keyword={keyword} pageId={pageId} languageId={currentLanguageId}>
            <PageContentRenderer sections={sections as any} />
        </PageContextProvider>
    );

    if (isHeadless) {
        return (
            <div
                className={`min-h-screen w-full page-content-transition ${
                    isContentUpdating ? 'page-content-loading' : ''
                }`}
                data-language-changing={isLanguageChanging}
            >
                {rendered}
            </div>
        );
    }

    return <div data-language-changing={isLanguageChanging}>{rendered}</div>;
}
