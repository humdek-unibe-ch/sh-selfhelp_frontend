'use client';

import { notFound, useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Container, Loader, Center, Text } from '@mantine/core';
import { PageContentProvider, usePageContentContext } from '../contexts/PageContentContext';
import { usePageContent } from '../../hooks/usePageContent';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { usePublicLanguages } from '../../hooks/usePublicLanguages';
import { useAuth } from '../../hooks/useAuth';
import { PageContentRenderer } from '../components/website/PageContentRenderer';
import { debug, info, warn } from '../../utils/debug-logger';

export default function DynamicPage() {
    const { slug } = useParams();
    const keyword = Array.isArray(slug) ? slug.join('/') : slug || '';

    return (
        <PageContentProvider>
            <Suspense fallback={
                <Center h="50vh">
                    <Loader size="lg" />
                </Center>
            }>
                <DynamicPageContent keyword={keyword} />
            </Suspense>
        </PageContentProvider>
    );
}

function DynamicPageContent({ keyword }: { keyword: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { defaultLanguage, isLoading: languagesLoading } = usePublicLanguages();
    
    const languageParam = searchParams.get('language');
    
    // Handle language parameter logic only after authentication is determined
    useEffect(() => {
        // Wait for authentication check to complete
        if (isAuthLoading || languagesLoading) {
            return;
        }

        // Now we know the user's authentication status
        if (!user && !languageParam && defaultLanguage) {
            // User is not logged in: add default language parameter
            const params = new URLSearchParams(searchParams);
            params.set('language', defaultLanguage.locale);
            const newUrl = `${pathname}?${params.toString()}`;
            
            debug('Auto-redirecting to add default language for guest user', 'DynamicPageContent', {
                keyword,
                defaultLanguage: defaultLanguage.locale,
                newUrl
            });
            
            router.replace(newUrl);
            return;
        }
        
        if (user && languageParam) {
            // User is logged in: remove language parameter
            const params = new URLSearchParams(searchParams);
            params.delete('language');
            
            const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
            
            debug('Removing language parameter for authenticated user', 'DynamicPageContent', {
                keyword,
                newUrl,
                previousUrl: `${pathname}?${searchParams.toString()}`
            });
            
            router.replace(newUrl);
        }
    }, [user, isAuthLoading, languageParam, defaultLanguage, languagesLoading, searchParams, pathname, router, keyword]);
    
    // Use the language parameter if provided, otherwise undefined to let backend use default
    const language = languageParam || undefined;
    
    const { content: queryContent, isLoading: pageLoading } = usePageContent(keyword, language);
    const { pageContent: contextContent } = usePageContentContext();
    const pageContent = contextContent || queryContent;

    const { routes, isLoading: navLoading } = useAppNavigation();
    
    // Debug logging
    const debugInfo = {
        keyword,
        languageParam,
        language,
        isAuthenticated: !!user,
        isAuthLoading,
        defaultLanguage: defaultLanguage?.locale,
        languagesLoading,
        routesCount: routes.length,
        routes: routes.map(r => ({ keyword: r.keyword, url: r.url, id: r.id_pages })),
        navLoading,
        pageLoading,
        hasContent: !!pageContent,
        pageData: pageContent?.page,
        sectionsCount: pageContent?.page?.sections?.length || 0
    };
    
    debug('Page render debug info', 'DynamicPageContent', debugInfo);
    
    // Find existence of page
    const exists = routes.some(p => p.keyword === keyword);
    
    info(`Page exists check: ${keyword}`, 'DynamicPageContent', { 
        keyword, 
        exists, 
        routesLength: routes.length 
    });
    
    useEffect(() => {
        if (!navLoading && routes.length > 0 && !exists) {
            warn('Page not found, redirecting to 404', 'DynamicPageContent', { keyword });
            notFound();
        }
    }, [routes, exists, navLoading, keyword]);

    // Show loading while authentication or languages are loading
    if (pageLoading || navLoading || languagesLoading || isAuthLoading) {
        return (
            <Center h="50vh">
                <Loader size="lg" />
            </Center>
        );
    }

    if (!exists) {
        return (
            <Container size="md">
                <Center h="50vh">
                    <Text size="lg" c="red">Error: Page not found in routes</Text>
                </Center>
            </Container>
        );
    }

    if (!pageContent || !pageContent.page) {
        return (
            <Container size="md">
                <Center h="50vh">
                    <Text size="lg" c="dimmed">No content found</Text>
                </Center>
            </Container>
        );
    }

    // Extract sections from the page data
    const sections = pageContent.page.sections || [];

    return (
        <Container size="xl" py="md">
            <PageContentRenderer sections={sections} />
        </Container>
    );
}
