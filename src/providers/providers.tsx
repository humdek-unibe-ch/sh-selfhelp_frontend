'use client';

/**
 * `ClientProviders` — the root client boundary for the app.
 *
 * Wraps every page with:
 *   - `QueryClientProvider` (shared instance from `getQueryClient()` so
 *     `HydrationBoundary` actually delivers the server-seeded cache),
 *   - `MantineProvider` + `Notifications` wired to the cookie-backed
 *     color-scheme manager (no flash on dark mode),
 *   - `NuqsAdapter` for URL-synced state,
 *   - `LanguageProvider` + `PreviewModeProvider` (cookie-driven SSR seed),
 *   - `RefineWrapper`, which forces Refine to share the same `QueryClient`
 *     via `reactQuery.clientConfig` instead of spinning up a nested one.
 *
 * Render is intentionally never gated on a "ready" flag — that defeats SSR.
 * SSR-safe initial state is supplied by the parent `ServerProviders`.
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
import { PreviewModeProvider } from '../app/components/contexts/PreviewModeContext';
import { theme } from '../../theme';
import type { MantineColorScheme } from '@mantine/core';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { cookieColorSchemeManager } from '../utils/cookie-color-scheme-manager';
import { useMemo, useState } from 'react';
import { useAclVersionWatcher } from '../hooks/useAclVersionWatcher';
import { useAclEventStream } from '../hooks/useAclEventStream';
import type { ILanguage } from '../types/responses/admin/languages.types';
import { getQueryClient } from './query-client';
import type { QueryClient } from '@tanstack/react-query';

function RefineWrapper({
    children,
    queryClient,
}: {
    children: React.ReactNode;
    queryClient: QueryClient;
}) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const { resources } = useAppNavigation({ isAdmin });

    // Surgical nav invalidation: whenever the server rotates `acl_version`
    // on the user payload, drop the frontend-pages cache.
    useAclVersionWatcher();

    // Real-time push from Symfony (`/auth/events` SSE proxied through the
    // BFF). On `acl-changed` we invalidate `user-data`; the refetch picks
    // up the new `acl_version` and `useAclVersionWatcher` cascades the
    // navigation/admin/page caches. Net effect: an async backend job that
    // grants the user a new page surfaces in the menu within ~1 RTT,
    // without requiring a click.
    useAclEventStream();

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
                // Force Refine to share our `QueryClient`. Without this it
                // would spin up its own and nested `QueryClientProvider`s
                // would shadow our SSR-seeded cache, so `useUserData` etc.
                // would all refetch on mount.
                reactQuery: {
                    clientConfig: queryClient,
                },
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
    /**
     * Preview flag resolved from the `sh_preview` cookie on the server.
     * `PreviewModeProvider` uses it to seed `isPreviewMode` so SSR and
     * first client render agree.
     */
    initialPreviewMode?: boolean;
    /**
     * Color scheme resolved from the `sh_color_scheme` cookie on the
     * server. Passed to `MantineProvider.defaultColorScheme` so the UI
     * kit starts from the same cookie-backed value as the root `<html>`.
     */
    initialColorScheme?: MantineColorScheme;
}

function ClientProviders({
    children,
    dehydratedState,
    initialLanguageId,
    initialLanguages,
    initialPreviewMode = false,
    initialColorScheme = 'auto',
}: IClientProvidersProps) {
    // `useState` pins the client for the component lifetime so StrictMode's
    // double-invoke can't replace it. `getQueryClient()` itself returns a
    // per-request client on the server and a long-lived one on the browser.
    const [queryClient] = useState(() => getQueryClient());

    // Stateless; memoise to keep MantineProvider's reference stable.
    const colorSchemeManager = useMemo(() => cookieColorSchemeManager(), []);

    return (
        <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
                <HydrationBoundary state={dehydratedState}>
                    <MantineProvider
                        defaultColorScheme={initialColorScheme}
                        colorSchemeManager={colorSchemeManager}
                        theme={theme}
                    >
                        <Notifications />
                        <LanguageProvider
                            initialLanguageId={initialLanguageId}
                            initialLanguages={initialLanguages}
                        >
                            <PreviewModeProvider initialPreviewMode={initialPreviewMode}>
                                <RefineWrapper queryClient={queryClient}>{children}</RefineWrapper>
                            </PreviewModeProvider>
                        </LanguageProvider>
                    </MantineProvider>
                    <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
                </HydrationBoundary>
            </QueryClientProvider>
        </NuqsAdapter>
    );
}

export { ClientProviders };
