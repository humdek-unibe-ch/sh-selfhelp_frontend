/**
 * Server-side providers that hydrate React Query with server-fetched data
 * This eliminates loading spinners and provides instant data availability
 */

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { theme } from '../../theme';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

interface IServerProvidersProps {
    children: React.ReactNode;
    dehydratedState?: any;
}

/**
 * Server-side providers wrapper that hydrates React Query state
 * and provides Mantine theme without client-side initialization
 */
export function ServerProviders({ children, dehydratedState }: IServerProvidersProps) {
    return (
        <MantineProvider
            defaultColorScheme="auto"
            theme={theme}
        >
            <Notifications />
            <HydrationBoundary state={dehydratedState}>
                {children}
            </HydrationBoundary>
        </MantineProvider>
    );
}

/**
 * Create and configure query client for server-side use
 */
export function createServerQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Server queries don't need caching since they run once
                staleTime: 0,
                gcTime: 0,
                retry: false, // Don't retry on server
            },
        },
    });
}

/**
 * Hydrate query client with server data
 */
export async function hydrateQueryClient(
    queryClient: QueryClient,
    userData: any,
    languages: any,
    frontendPages: any,
    cssClasses: any,
    adminPages?: any,
    cmsPreferences?: any
) {
    // Hydrate user data if available
    if (userData) {
        queryClient.setQueryData(['auth', 'user-data'], {
            data: userData,
            status: 200,
            message: 'Success',
            error: null,
        });
    }

    // Hydrate languages (public or admin based on auth)
    if (languages) {
        const queryKey = userData ? ['languages'] : ['public-languages'];
        queryClient.setQueryData(queryKey, languages);
    }

    // Hydrate frontend pages
    if (frontendPages && userData?.language) {
        queryClient.setQueryData(
            REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES(userData.language.id),
            frontendPages
        );
    } else if (frontendPages) {
        // For non-authenticated users, use default language ID 1
        queryClient.setQueryData(
            REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES(1),
            frontendPages
        );
    }

    // Hydrate CSS classes
    if (cssClasses) {
        queryClient.setQueryData(['css-classes'], cssClasses);
    }

    // Hydrate admin data if available
    if (adminPages) {
        queryClient.setQueryData(REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES, adminPages);
    }

    if (cmsPreferences) {
        queryClient.setQueryData(['cms-preferences'], cmsPreferences);
    }

    return dehydrate(queryClient);
}
