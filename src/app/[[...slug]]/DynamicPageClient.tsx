/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { Container, Loader, Center, Text } from '@mantine/core';
import { useIsFetching } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PageModal } from './PageModal';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import { useLanguageContext } from '../components/contexts/LanguageContext';
import { usePreviewMode } from '../components/contexts/PreviewModeContext';
import { usePageContentByKeyword } from '../../hooks/usePageContentByKeyword';
import { usePageContentByPath } from '../../hooks/usePageContentByPath';
import { useSyncDocumentMetadata } from '../../hooks/useSyncDocumentMetadata';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useRecordLastVisitedPage } from '../../hooks/useRecordLastVisitedPage';
import { PageContextProvider } from '../components/contexts/PageContext';
import { PageModalProvider } from '../components/contexts/PageModalContext';
import { PageContentRenderer } from '../components';
import { BranchNavigation } from '../components/frontend/navigation/BranchNavigation';
import { resolveHolderRedirectPath, isPageOnWebMenu } from '../../shared';
import { stripHtmlTags } from '../../utils/html-sanitizer.utils';
import { type TStyle } from '../../types/common/styles.types';

interface IDynamicPageClientProps {
    keyword: string;
    /**
     * Page id resolved on the server. Used to seed the `PageContext` for
     * child style components that look up content via `usePageContentValue`.
     * The canonical content still lives in the React Query cache that was
     * hydrated by the slug layout.
     */
    initialPageId: number;
    /**
     * Full public URL path the page was resolved from (DB routing, issue #30).
     * When present the content is read from the path-keyed cache so
     * parameterized records (`/team/7`) never share another record's cache.
     * Absent only for the hardcoded maintenance render, which is keyword-keyed.
     */
    path?: string;
    /** Snake_case route params from the matched pattern (`{ user_id, token }`, `{ record_id }`). */
    routeParams?: Record<string, string>;
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
export default function DynamicPageClient({
    keyword,
    initialPageId,
    path,
    routeParams,
}: IDynamicPageClientProps) {
    const { currentLanguageId } = useLanguageContext();
    const { isPreviewMode } = usePreviewMode();
    const router = useRouter();

    // Public slug pages resolve by PATH (DB routing); the keyword-keyed hook is
    // kept only for the hardcoded maintenance render (no path). Both hooks read
    // a cache slot under the `page-by-keyword` prefix, so a single
    // `useIsFetching(PAGE_BY_KEYWORD_ALL)` still tracks either one.
    const byPath = usePageContentByPath(path ?? '', { preview: isPreviewMode, enabled: Boolean(path) });
    const byKeyword = usePageContentByKeyword(keyword, { preview: isPreviewMode, enabled: !path });
    const {
        content: pageContent,
        isLoading,
        isFetching,
        isPlaceholderData,
    } = path ? byPath : byKeyword;

    // React Query is the single source of truth for "language change in
    // flight": a language switch invalidates `page-by-keyword`, which
    // surfaces here as `useIsFetching` > 0.
    const pendingLangFetches = useIsFetching({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
    const isLanguageChanging = pendingLangFetches > 0;

    const pageId = pageContent?.id ?? initialPageId;
    const isHeadless = Boolean(pageContent?.is_headless);

    // In-page branch navigation from the resolved public menu tree.
    const { navigation } = useAppNavigation();

    // When the resolved page opts into `open_in_modal`, its content is rendered
    // inside a modal overlay (CMS-in-CMS create/edit/detail opened from a list).
    // Off-menu public pages (not on web header/footer) also open in a modal,
    // mirroring mobile off-menu behaviour once navigation has loaded.
    const offWebMenu = Boolean(
        pageContent && navigation && pageId > 0 && !isHeadless && !isPageOnWebMenu(navigation, pageId),
    );
    const isModal = Boolean(pageContent?.open_in_modal) || offWebMenu;
    const closeModal = useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    }, [router]);
    const isContentUpdating = isFetching || isLanguageChanging;
    const sections = useMemo(() => pageContent?.sections ?? [], [pageContent]);

    const hasBranchNav = Boolean(navigation && pageId > 0);
    const hasSections = sections.length > 0;

    useEffect(() => {
        if (!navigation || !pageContent || hasSections) {
            return;
        }
        const target = resolveHolderRedirectPath(navigation, pageId, 'web', hasSections);
        if (!target || target === path) {
            return;
        }
        router.replace(target);
    }, [navigation, pageContent, hasSections, pageId, path, router]);

    // SSR `generateMetadata()` paints the correct tab title on first load.
    // After that, language switches refresh the content via React Query but
    // leave the server-rendered `<title>` / description untouched — this
    // hook keeps them in sync without requiring a full reload.
    useSyncDocumentMetadata(pageContent?.title ?? null, pageContent?.description ?? null);
    useRecordLastVisitedPage(
        pageId,
        keyword,
        pageContent?.url ?? path ?? null,
        Boolean(pageContent) && !isModal && !pageContent?.is_headless,
    );

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

    // Prefer the route params the resolver returned on the live content; fall
    // back to the SSR-provided prop for the very first paint before hydration.
    const effectiveRouteParams = pageContent?.route_params ?? routeParams;

    const rendered = (
        <PageModalProvider value={{ inModal: isModal, closeModal }}>
            <PageContextProvider
                keyword={keyword}
                pageId={pageId}
                languageId={currentLanguageId}
                path={path ?? null}
                routeParams={effectiveRouteParams}
            >
                {/* In modal mode the page is just its content (no child-nav menu). */}
                {!isModal && hasBranchNav && (
                    <BranchNavigation navigation={navigation} currentPageId={pageId} compact={hasSections} />
                )}
                {(isModal || hasSections || !hasBranchNav) && (
                    <PageContentRenderer sections={sections as unknown as TStyle[]} />
                )}
            </PageContextProvider>
        </PageModalProvider>
    );

    // `open_in_modal`: render the page content inside a STANDARDIZED modal
    // overlay (same header for every page modal). The author controls only the
    // box size via `modal_width` / `modal_height` (default 80%, capped at 90%
    // of the viewport, `auto` fits content). The close button (and backdrop)
    // return to the previous page. Web-only — mobile renders a normal screen.
    if (isModal) {
        return (
            <PageModal
                title={stripHtmlTags(pageContent.title ?? '')}
                width={pageContent.modal_width}
                height={pageContent.modal_height}
                onClose={closeModal}
                dataLanguageChanging={isLanguageChanging}
            >
                {rendered}
            </PageModal>
        );
    }

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
