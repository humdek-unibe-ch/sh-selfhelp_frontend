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
import Breadcrumb from "../layout/shared/breadcrumb/Breadcrumb";
import { useEffect } from 'react';
import { PageService } from '@/services/page.service';
import { usePageContentContext } from "@/contexts/PageContentContext";

/**
 * Dynamic page component that renders content based on URL slug
 * @param {Object} props - Component props
 * @param {Object} props.params - URL parameters
 * @param {string} props.params.slug - Page slug from URL
 */
export default function DynamicPage({ params }: { params: { slug: string } }) {
    // Get routes for navigation and validation
    const { routes, isLoading: routesLoading } = useNavigation();
    const { pageContent: contextContent } = usePageContentContext();

    // Validate if the current route exists
    const isValid = routes?.some(route => route.path === `/${params.slug}`);
    const { content: queryContent, isLoading: pageLoading } = usePageContent(params.slug, isValid);

    // Use context content if available, otherwise use query content
    const pageContent = contextContent || queryContent;
    console.log(pageContent);

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

    // Handle loading states
    if (routesLoading || pageLoading) {
        return (
            <PageContainer>
                <div>Loading...</div>
            </PageContainer>
        );
    }

    // Handle invalid routes
    if (!isValid) {
        notFound();
    }

    // Get page title
    const pageTitle = pageContent?.title || params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

    // Render page content
    return (
        <PageContainer title={pageTitle} description={pageContent?.description}>
            <Breadcrumb
                title={pageTitle}
                items={breadcrumbItems}
                subtitle={pageContent?.description}
            />
            <>
                {pageContent?.content.map((style, index) => (
                    style ? <BasicStyle key={index} style={style} /> : null
                ))}
            </>
        </PageContainer>
    );
}