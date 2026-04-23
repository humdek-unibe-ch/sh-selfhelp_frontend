/**
 * Server-side provider shell.
 *
 * This file is a **Server Component** (no `'use client'`). It owns the SSR
 * half of the provider pipeline:
 *
 *   1. Resolve the active language against the live `/languages` list.
 *   2. Prefetch + dehydrate the `['public-languages']` React Query cache so
 *      the client tree hydrates with the real list on first paint (no
 *      skeleton flash in `LanguageSelector`).
 *   3. Forward the resolved `initialLanguageId` + `initialLanguages` into
 *      `ClientProviders`, which is the client boundary.
 *
 * Splitting server vs. client providers into two files (rather than inlining
 * the server work in `src/app/layout.tsx`) keeps the layout file focused on
 * HTML shell concerns (`<html>`, `<head>`, color-scheme bootstrap) and makes
 * it obvious which code runs where.
 */

import { QueryClient, dehydrate } from '@tanstack/react-query';
import { ClientProviders } from './providers';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { getPublicLanguagesSSR, resolveLanguageSSR } from '../app/_lib/server-fetch';

export async function ServerProviders({ children }: { children: React.ReactNode }) {
    const [{ id: initialLanguageId, languages }] = await Promise.all([
        resolveLanguageSSR(),
    ]);

    // Seed the React Query cache with the same list so any client hook
    // reading `['public-languages']` hydrates without an extra network
    // round-trip.
    const queryClient = new QueryClient({
        defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS,
    });
    if (Array.isArray(languages) && languages.length > 0) {
        queryClient.setQueryData(REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES, languages);
    } else {
        // Defensive fallback: if resolveLanguageSSR returned an empty list
        // (e.g. the first resolve was short-circuited), prefetch directly.
        await queryClient
            .prefetchQuery({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES,
                queryFn: async () => (await getPublicLanguagesSSR()) ?? [],
            })
            .catch(() => undefined);
    }

    const dehydratedState = dehydrate(queryClient);

    return (
        <ClientProviders
            dehydratedState={dehydratedState}
            initialLanguageId={initialLanguageId}
            initialLanguages={languages as any}
        >
            {children}
        </ClientProviders>
    );
}
