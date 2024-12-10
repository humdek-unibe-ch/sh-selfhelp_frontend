'use client';

import { MantineProvider } from '@mantine/core';
import { Refine } from '@refinedev/core';
import { theme } from '../theme';
import appRouter from '@refinedev/nextjs-router';
import dataProvider from '@refinedev/simple-rest';
import { API_CONFIG } from './config/api.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { LoadingScreen } from './components/common/LoadingScreen';
import { useNavigation } from './hooks/useNavigation';
import { useEffect, useState } from 'react';
import { authProvider } from './providers/auth.provider';

// Create a client with optimized settings
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000, // 1 second
            gcTime: 24 * 60 * 60 * 1000, // 24 hours
        },
    },
});

// Initialize persistence
if (typeof window !== 'undefined') {
    const persister = createSyncStoragePersister({
        storage: window.localStorage,
        key: 'app-cache', // Unique key for your app
    });

    persistQueryClient({
        queryClient,
        persister,
        // dehydrateOptions: {
        //     shouldDehydrateQuery: ({ queryKey }) => {
        //         // Only persist navigation and auth queries
        //         return ['navigation', 'auth'].includes(queryKey[0] as string);
        //     },
        // },
    });
}

function NavigationLoader({ children }: { children: React.ReactNode }) {
    const { error, menuItems } = useNavigation();

    if (error) {
        console.error('Failed to load navigation:', error);
        return <div>Failed to load application. Please refresh the page.</div>;
    }

    // Don't show loading to prevent flicker
    return <>{children}</>;
}

function Providers({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Mark as ready after hydration
        setIsReady(true);
    }, []);

    if (!isReady) {
        return null;
    }

    return (
        <MantineProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
                <Refine
                    routerProvider={appRouter}
                    dataProvider={dataProvider(API_CONFIG.BASE_URL)}
                    authProvider={authProvider}
                    resources={[
                        {
                            name: "content",
                            meta: {
                                canDelete: false,
                                label: "Content",
                            },
                            list: "/content/all_routes",
                            show: "/content/page/:keyword",
                        }
                    ]}
                    options={{
                        syncWithLocation: true,
                        warnWhenUnsavedChanges: true,
                        disableTelemetry: true,
                        // reactQuery: {
                        //     clientConfig: queryClient, // Pass the same client to Refine
                        //     devtoolConfig: false,
                        // },
                    }}
                >
                    {/* <NavigationLoader> */}
                        {children}
                    {/* </NavigationLoader> */}
                </Refine>
            </QueryClientProvider>
        </MantineProvider>
    );
}

export { Providers };
