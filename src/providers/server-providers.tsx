/**
 * Server-side provider shell (Server Component).
 *
 * Resolves SSR-scoped state (language, preview flag, color scheme,
 * authenticated user) once per request, seeds them into a `QueryClient`,
 * and passes the dehydrated cache + the cookie-derived flags to
 * `ClientProviders` (the client boundary).
 *
 * Splitting server vs. client providers into two files keeps the root
 * `app/layout.tsx` focused on `<html>`/`<head>` concerns and makes the
 * runtime split obvious.
 */

import { dehydrate } from '@tanstack/react-query';
import { cookies } from 'next/headers';
import { ClientProviders } from './providers';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { getQueryClient } from './query-client';
import {
    getAuthMeSSR,
    getPublicLanguagesSSR,
    resolveColorSchemeSSR,
    resolveLanguageSSR,
    resolvePreviewSSR,
} from '../app/_lib/server-fetch';
import { AUTH_COOKIE } from '../config/cookie-names';

export async function ServerProviders({ children }: { children: React.ReactNode }) {
    const jar = await cookies();
    const hasAuthCookie = Boolean(jar.get(AUTH_COOKIE)?.value);

    // Resolve every SSR-scoped concern in parallel:
    //   - language (cookie or accept-language hint)
    //   - user envelope (only when sh_auth is present — anonymous visitors
    //     would otherwise pay for a guaranteed 401 on every page)
    //   - preview flag (admin draft view)
    //   - color scheme (light / dark / auto)
    const [
        { id: initialLanguageId, languages },
        userData,
        initialPreviewMode,
        initialColorScheme,
    ] = await Promise.all([
        resolveLanguageSSR(),
        hasAuthCookie ? getAuthMeSSR() : Promise.resolve(null),
        resolvePreviewSSR(),
        resolveColorSchemeSSR(),
    ]);

    const queryClient = getQueryClient();

    if (Array.isArray(languages) && languages.length > 0) {
        queryClient.setQueryData(REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES, languages);
    } else {
        await queryClient
            .prefetchQuery({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PUBLIC_LANGUAGES,
                queryFn: async () => (await getPublicLanguagesSSR()) ?? [],
            })
            .catch(() => undefined);
    }

    // Seed `['user-data']` for both authenticated AND anonymous visitors so
    // `useAuthStatus` resolves on first paint with no XHR. We deliberately
    // skip the negative seed when the upstream call FAILED for an
    // authenticated visitor (`userData === null && hasAuthCookie`) so a
    // transient backend outage doesn't render as a logout.
    if (userData) {
        queryClient.setQueryData(REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA, userData);
    } else if (!hasAuthCookie) {
        queryClient.setQueryData(REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA, {
            status: 200,
            message: null,
            error: null,
            data: null,
        });
    }

    return (
        <ClientProviders
            dehydratedState={dehydrate(queryClient)}
            initialLanguageId={initialLanguageId}
            initialLanguages={languages as any}
            initialPreviewMode={initialPreviewMode}
            initialColorScheme={initialColorScheme}
        >
            {children}
        </ClientProviders>
    );
}
