/**
 * Dynamic Page Component for Dashboard Layout.
 * Renders content based on the URL slug parameter, managing page content
 * through React Query and Context API. Includes breadcrumb navigation
 * and dynamic content rendering through BasicStyle components.
 * 
 * @module app/(DashboardLayout)/[slug]/page
 */

"use client";
import { notFound } from 'next/navigation';
import PageContainer from "@/app/components/container/PageContainer";
import { useNavigation } from "@/hooks/useNavigation";
import { usePageContent } from "@/hooks/usePageContent";
import BasicStyle from "@/app/components/styles/BasicStyle";
import { useEffect, useState } from 'react';
import { PageService } from '@/services/page.service';
import { usePageContentContext } from "@/contexts/PageContentContext";
import HpHeader from '@/app/components/shared/frontend-pages/header/HpHeader';
import Footer from '@/app/components/shared/frontend-pages/footer';
import ScrollToTop from '@/app/components/shared/frontend-pages/scroll-to-top';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';

/**
 * Dynamic page component that renders content based on URL slug
 * @param {Object} props - Component props
 * @param {Object} props.params - URL parameters
 * @param {string} props.params.slug - Page slug from URL
 */
export default function DynamicPage({ params }: { params: { slug: string } }) {
    // Get routes for navigation and validation
    const { 
        routes, 
        isLoading: routesLoading,
        isFetching: routesFetching
    } = useNavigation();
    const { pageContent: contextContent } = usePageContentContext();

    // Validate if the current route exists
    const isValid = routes?.some(route => route.path === `/${params.slug}`);
    const { 
        content: queryContent, 
        isLoading: pageLoading,
        isFetching: pageFetching,
        isSuccess: pageSuccess 
    } = usePageContent(params.slug, isValid);

    // Use context content if available, otherwise use query content
    const pageContent = contextContent || queryContent;
    const isInitialLoading = (routesLoading || pageLoading) && (routesFetching || pageFetching);
    console.log('isInitialLoading:', isInitialLoading);

    // Configure breadcrumb navigation
    const breadcrumbItems = [
        {
            title: "Home",
            to: "/"
        },
        {
            title: pageContent?.title || params.slug.charAt(0).toUpperCase() + params.slug.slice(1)
        }
    ];

    // Update current page keyword
    useEffect(() => {
        PageService.setKeyword(params.slug);
    }, [params.slug]);

    // Get page title
    const pageTitle = pageContent?.title || params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

    // Render page content
    return (
        <>
            <HpHeader />
            <PageContainer title="Homepage" description="this is Homepage">
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