'use client';

/**
 * `ClientProviders` — the root client boundary for the app.
 *
 * It wraps every page with:
 *   - `QueryClientProvider` for TanStack Query (shared module-level client).
 *   - `MantineProvider` + `Notifications` for the UI kit.
 *   - `NuqsAdapter` for URL-synced state.
 *   - `LanguageProvider` for locale context (to be simplified further in the
 *     next milestone once the cookie-driven bootstrap is live).
 *   - `RefineWrapper` which owns the Refine auth/data providers.
 *
 * The file is intentionally minimal and does **not** gate render on any
 * client-side readiness flag — that used to cause a forced second render
 * that defeated SSR. The root layout is a Server Component (see
 * `src/app/layout.tsx`) and is responsible for providing
 * SSR-safe initial state.
 */

if (process.env.NODE_ENV === 'development') {
    import('../utils/performance-monitor.utils').then(({ enableProfiling }) => {
        enableProfiling();
        console.log('[Performance Monitor] React DevTools profiling enabled automatically in development');
    });
}

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Refine } from '@refinedev/core';
import appRouter from '@refinedev/nextjs-router';
import dataProvider from '@refinedev/simple-rest';
import { API_CONFIG } from '../config/api.config';
import { QueryClientProvider, HydrationBoundary, type DehydratedState } from '@tanstack/react-query';

import { useAppNavigation } from '../hooks/useAppNavigation';
import { usePathname } from 'next/navigation';
import { authProvider } from './auth.provider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LanguageProvider } from '../app/components/contexts/LanguageContext';
import { theme } from '../../theme';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useAclVersionWatcher } from '../hooks/useAclVersionWatcher';
import type { ILanguage } from '../types/responses/admin/languages.types';
import { queryClient } from './query-client';

function RefineWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const { resources } = useAppNavigation({ isAdmin });

    // Surgical nav invalidation: whenever the server rotates `acl_version`
    // on the user payload, drop the frontend-pages cache.
    useAclVersionWatcher();

    // Important: do NOT block rendering on `isLoading`. The navigation query
    // is prefetched on the server when SSR is enabled, and the tree below
    // does not depend on navigation being resolved before first paint.

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
            {children}
        </Refine>
    );
}

interface IClientProvidersProps {
    children: React.ReactNode;
    /** Optional dehydrated state piped from a Server Component. */
    dehydratedState?: DehydratedState;
    /** Initial language id resolved from `sh_lang` cookie on the server. */
    initialLanguageId?: number;
    /**
     * Public languages resolved on the server. Threaded through to
     * `LanguageProvider` so the first client paint renders the language
     * selector + default locale without waiting on a client fetch.
     */
    initialLanguages?: ILanguage[];
}

function ClientProviders({
    children,
    dehydratedState,
    initialLanguageId,
    initialLanguages,
}: IClientProvidersProps) {
    return (
        <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
                <HydrationBoundary state={dehydratedState}>
                    <MantineProvider defaultColorScheme="auto" theme={theme}>
                        <Notifications />
                        <LanguageProvider
                            initialLanguageId={initialLanguageId}
                            initialLanguages={initialLanguages}
                        >
                            <RefineWrapper>{children}</RefineWrapper>
                        </LanguageProvider>
                    </MantineProvider>
                    <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
                </HydrationBoundary>
            </QueryClientProvider>
        </NuqsAdapter>
    );
}

export { ClientProviders };
