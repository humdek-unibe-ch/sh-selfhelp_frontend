'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Refine } from '@refinedev/core';
import appRouter from '@refinedev/nextjs-router';
import dataProvider from '@refinedev/simple-rest';
import { API_CONFIG } from '../config/api.config';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useNavigationPrefetch } from '../hooks/useNavigationPrefetch';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { authProvider } from './auth.provider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LoadingScreen } from '../app/components/shared/common/LoadingScreen';
import { LanguageProvider } from '../app/components/contexts/LanguageContext';
import { EnhancedLanguageProvider } from '../app/components/contexts/EnhancedLanguageProvider';
import { theme } from '../../theme';

// Create a client with global configuration settings WITHOUT persistence
const queryClient = new QueryClient({
    defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS,
});

function RefineWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const { resources, isLoading } = useAppNavigation({ isAdmin });

    // Initialize navigation prefetching for smooth page transitions
    // TODO: Uncomment this when we have a way to prefetch the navigation data
    // useNavigationPrefetch();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Refine
            routerProvider={appRouter}
            dataProvider={dataProvider(API_CONFIG.BASE_URL)}
            authProvider={authProvider}
            resources={resources}
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                disableTelemetry: true,
            }}
        >
            <EnhancedLanguageProvider>
                {children}
            </EnhancedLanguageProvider>
        </Refine>
    );
}

/**
 * Optimized Providers without localStorage persistence
 * Eliminates stale data issues while maintaining performance
 */
export function OptimizedProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider
                defaultColorScheme="auto"
                theme={theme}
            >
                <Notifications />
                <LanguageProvider>
                    <RefineWrapper>
                        {children}
                    </RefineWrapper>
                </LanguageProvider>
            </MantineProvider>
            <ReactQueryDevtools
                initialIsOpen={false}
                buttonPosition="bottom-right"
            />
        </QueryClientProvider>
    );
}
