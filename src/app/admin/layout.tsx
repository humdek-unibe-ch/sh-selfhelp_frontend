/**
 * Admin route-group Server Component layout.
 *
 * Responsibilities (in order):
 *  1. Hard gate: if the httpOnly `sh_auth` cookie is missing we redirect to
 *     `/auth/login`. The middleware performs the same check but doing it
 *     again here means even a bypassed matcher can't leak admin HTML.
 *  2. Prefetch the admin pages tree and the authenticated user's profile in
 *     parallel and dehydrate the result into a `HydrationBoundary`. This
 *     skips the first-load "empty navbar → real navbar" flash.
 *  3. Delegate all interactive shell UI to `<AdminShell>` (client component).
 *
 * The client-side `AdminShell` still calls `useIsAuthenticated` because a
 * stale cookie can produce a 401; the BFF silent-refresh in
 * `src/app/api/[...path]/route.ts` handles the happy path, and an
 * unrecoverable 401 bubbles up so the shell can redirect.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import { ROUTES } from '../../config/routes.config';
import { getAdminLookupsSSR, getAdminPagesSSR, getAuthMeSSR } from '../_lib/server-fetch';
import { AUTH_COOKIE } from '../../config/server.config';

export default async function AdminRouteLayout({ children }: { children: React.ReactNode }) {
    const jar = await cookies();
    if (!jar.get(AUTH_COOKIE)) {
        redirect(ROUTES.LOGIN);
    }

    const queryClient = new QueryClient({
        defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS,
    });

    await Promise.all([
        queryClient
            .prefetchQuery({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES,
                queryFn: async () => {
                    const raw = await getAdminPagesSSR();
                    const data = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
                    return data;
                },
            })
            .catch(() => undefined),
        queryClient
            .prefetchQuery({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
                // IMPORTANT: store the FULL envelope (IUserDataResponse), not
                // the unwrapped `data` object. The client `useUserData` hook
                // returns `AuthApi.getUserData()` which is the full envelope
                // and reads `query.data?.data?.permissions` from it; if we
                // dehydrate `raw.data` instead of `raw`, the permission
                // manager never gets populated and every admin permission
                // check fails ("no access" loop + missing navbar).
                queryFn: async () => {
                    const raw = await getAuthMeSSR();
                    return raw ?? null;
                },
            })
            .catch(() => undefined),
        queryClient
            .prefetchQuery({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LOOKUPS,
                queryFn: async () => {
                    const raw = await getAdminLookupsSSR();
                    const data = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
                    return data;
                },
                staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.staleTime,
            })
            .catch(() => undefined),
    ]);

    // If the /auth/user-data call came back empty — or returned an envelope
    // without a user object — the cookie was present but invalid/expired.
    // Bounce to login; the client provider will clear any residual state.
    const me = queryClient.getQueryData<{ data?: unknown } | null>(
        REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA
    );
    if (!me || !me.data) {
        redirect(ROUTES.LOGIN);
    }

    const dehydratedState = dehydrate(queryClient);

    return <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>;
}
