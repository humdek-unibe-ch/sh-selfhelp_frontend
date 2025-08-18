'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Refine } from '@refinedev/core';
import appRouter from '@refinedev/nextjs-router';
import dataProvider from '@refinedev/simple-rest';
import { API_CONFIG } from '../config/api.config';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { usePathname } from 'next/navigation';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LanguageProvider } from '../app/contexts/LanguageContext';
import { EnhancedLanguageProvider } from '../app/contexts/EnhancedLanguageProvider';
import { authProvider } from './auth.provider';
import { useState } from 'react';

// Create query client WITHOUT persistence to eliminate stale data issues
const createQueryClient = () => new QueryClient({
    defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS,
});

interface IClientProvidersProps {
    children: React.ReactNode;
    serverData: {
        userData: any;
        languages: any;
        frontendPages: any;
        cssClasses: any;
        adminPages: any;
        cmsPreferences: any;
    };
}

function RefineWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <Refine
            routerProvider={appRouter}
            dataProvider={dataProvider(API_CONFIG.BASE_URL)}
            authProvider={authProvider}
            resources={[]} // Start with empty resources, will be populated by useAppNavigation hook
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
 * Client-side providers that handle interactivity and React Query
 * Receives hydrated data from server to eliminate loading states
 */
export function ClientProviders({ children, serverData }: IClientProvidersProps) {
    const [queryClient] = useState(() => createQueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider initialData={serverData}>
                <RefineWrapper>
                    {children}
                </RefineWrapper>
            </LanguageProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
