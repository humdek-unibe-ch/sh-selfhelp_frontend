'use client';

import { MantineProvider } from '@mantine/core';
import { Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import { theme } from '../theme';
import appRouter from '@refinedev/nextjs-router';
import dataProvider from '@refinedev/simple-rest';
import { API_CONFIG } from './config/api.config';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { LoadingScreen } from './components/common/LoadingScreen';
import { useNavigation } from './hooks/useNavigation';
import { useEffect } from 'react';

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000,
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
        },
    },
});

function NavigationLoader({ children }: { children: React.ReactNode }) {
    const { isLoading, error, menuItems } = useNavigation();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (error) {
        console.error('Failed to load navigation:', error);
        return <div>Failed to load application. Please refresh the page.</div>;
    }

    if (!menuItems?.length) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}

function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const persister = createSyncStoragePersister({
            storage: window.localStorage,
        });

        persistQueryClient({
            queryClient,
            persister,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        });
    }, []);

    return (
        <MantineProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <RefineKbarProvider>
                        <Refine
                            routerProvider={appRouter}
                            dataProvider={dataProvider(API_CONFIG.BASE_URL)}
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
                            }}
                        >
                            <NavigationLoader>
                                {children}
                            </NavigationLoader>
                            <RefineKbar />
                        </Refine>
                    </RefineKbarProvider>
                </AuthProvider>
            </QueryClientProvider>
        </MantineProvider>
    );
}

export { Providers };
