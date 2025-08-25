'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Refine } from '@refinedev/core';
import appRouter from '@refinedev/nextjs-router';
import dataProvider from '@refinedev/simple-rest';
import { API_CONFIG } from '../config/api.config';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authProvider } from './auth.provider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LoadingScreen } from '../app/components/shared/common/LoadingScreen';
import { LanguageProvider } from '../app/components/contexts/LanguageContext';
import { EnhancedLanguageProvider } from '../app/components/contexts/EnhancedLanguageProvider';
import { theme } from '../../theme';

// Create a client with global configuration settings
const queryClient = new QueryClient({
    defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS,
});

// Initialize persistence with shorter cache time
if (typeof window !== 'undefined') {
    const persister = createSyncStoragePersister({
        storage: window.localStorage,
        key: 'app-cache', // Unique key for your app
    });

    persistQueryClient({
        queryClient,
        persister,
        maxAge: REACT_QUERY_CONFIG.CACHE.gcTime, // Use global cache time for persistence
    });
}

function RefineWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const { resources, isLoading } = useAppNavigation({ isAdmin });

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

function Providers({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    if (!isReady) {
        return null;
    }

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
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools 
                    initialIsOpen={false}
                    position="bottom-right"
                    buttonPosition="bottom-right"
                />
            )}
        </QueryClientProvider>
    );
}

export { Providers };
