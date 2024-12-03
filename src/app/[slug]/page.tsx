/**
 * @fileoverview Dynamic page component that handles content rendering based on URL slugs.
 * This is a client-side component that manages dynamic routing, content loading,
 * and rendering of page content using various services and contexts.
 */

"use client";
import { notFound } from 'next/navigation';
import PageContainer from "@/app/components/container/PageContainer";
import { useNavigation } from "@/hooks/useNavigation";
import { usePageContent } from "@/hooks/usePageContent";
import BasicStyle from "@/app/components/styles/BasicStyle";
import { useEffect } from 'react';
import { PageService } from '@/services/page.service';
import { usePageContentContext } from "@/contexts/PageContentContext";
import HpHeader from '@/app/components/shared/frontend-pages/header/HpHeader';
import Footer from '@/app/components/shared/frontend-pages/footer';
import ScrollToTop from '@/app/components/shared/frontend-pages/scroll-to-top';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';

/**
 * Interface for the DynamicPage component props
 * @interface DynamicPageProps
 */
interface DynamicPageProps {
    /** URL parameters object containing the page slug */
    params: {
        /** The URL slug that determines which page content to load */
        slug: string;
    };
}

/**
 * Dynamic page component that renders content based on the URL slug.
 * Handles loading states, route validation, and content rendering.
 * 
 * @component
 * @param {DynamicPageProps} props - Component properties
 * @returns {JSX.Element} Rendered page content with header, footer, and scroll-to-top functionality
 * 
 * @example
 * // This component is typically rendered by Next.js routing
 * // URL: /about
 * <DynamicPage params={{ slug: 'about' }} />
 */
export default function DynamicPage({ params }: DynamicPageProps) {
    // Get routes for navigation and validation
    const {
        routes,
        isLoading: routesLoading,
        isFetching: routesFetching
    } = useNavigation();

    /** Get page content from context if available */
    const { pageContent: contextContent } = usePageContentContext();

    /** Validate if the current route exists in available routes */
    const isValid = routes?.some(route => route.path === `/${params.slug}`);

    /** Fetch page content if route is valid */
    const {
        content: queryContent,
        isLoading: pageLoading,
        isFetching: pageFetching,
        isSuccess: pageSuccess
    } = usePageContent(params.slug, isValid);

    /** Determine which content to use (context or query) and loading state */
    const pageContent = contextContent || queryContent;
    const isInitialLoading = (routesLoading || pageLoading) && (routesFetching || pageFetching);

    /** Update page keyword when slug changes */
    useEffect(() => {
        PageService.setKeyword(params.slug);
    }, [params.slug]);

    /** Get formatted page title */
    const pageTitle = pageContent?.title || params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

    return (
        <>
            <HpHeader />
            <PageContainer title={pageTitle} description="TODO: Page Description">
                {isInitialLoading ? (
                    <LoadingSpinner />
                ) : !isValid && !routesLoading ? (
                    notFound()
                ) : (
                    <>
                        {pageContent?.content.map((style, index) => (
                            style ? <BasicStyle key={index} style={style} /> : null
                        ))}
                    </>
                )}
            </PageContainer>
            <Footer />
            <ScrollToTop />
        </>
    );
}