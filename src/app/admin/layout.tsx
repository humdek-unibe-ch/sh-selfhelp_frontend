/**
 * Admin route-group Server Component layout.
 *
 * Responsibilities (in order):
 *  1. Hard gate: if the httpOnly `sh_auth` cookie is missing OR
 *     `/auth/user-data` returns an empty envelope, redirect to login.
 *  2. Prefetch the admin pages tree + lookups and dehydrate them into a
 *     `HydrationBoundary` so the navbar / inspector dropdowns render on
 *     first paint instead of flashing empty.
 *  3. Delegate all interactive shell UI to `<AdminShell>` (client component).
 *
 * The client `AdminShell` reads auth from the SSR-hydrated `['user-data']`
 * cache via `useAuthStatus`; it only redirects on mid-session expiry (a 401
 * surfaces as `isAuthenticated === false`). The `['user-data']` cache itself
 * is seeded once by `ServerProviders` — we deliberately do NOT re-seed it
 * here. The `getAuthMeSSR` call below is wrapped in React `cache()`, so it
 * shares its single Symfony round-trip with `ServerProviders`.
 */

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import { ROUTES } from '../../config/routes.config';
import { getAdminLookupsSSR, getAdminPagesSSR, getAuthMeSSR } from '../_lib/server-fetch';
import { AUTH_COOKIE } from '../../config/server.config';
import { getQueryClient } from '../../providers/query-client';

/**
 * Admin route-group metadata.
 *
 * Overrides the root `title.template` for any admin child so the browser
 * tab clearly shows both the section name and the product brand, e.g.:
 *
 *   Users page         → "Users · Admin · SelfHelp"
 *   Index (no title)   → "Admin · SelfHelp"
 *
 * Individual admin pages only need `export const metadata = { title: 'X' }`
 * — the template below composes the suffix automatically. Prevents the
 * previous "every admin tab just says SelfHelp" problem.
 *
 * `robots` is also hardened here: admin pages should never be indexed even
 * if the middleware is ever bypassed.
 */
export const metadata: Metadata = {
    title: {
        default: 'Admin · SelfHelp',
        template: '%s · Admin · SelfHelp',
    },
    robots: { index: false, follow: false },
};

export default async function AdminRouteLayout({ children }: { children: React.ReactNode }) {
    const jar = await cookies();
    if (!jar.get(AUTH_COOKIE)) {
        redirect(ROUTES.LOGIN);
    }

    // Authoritative auth gate: an empty envelope means the cookie was
    // present but invalid/expired. `getAuthMeSSR` is `cache()`-wrapped, so
    // this shares its round-trip with the seed in `ServerProviders` instead
    // of double-hitting Symfony.
    const me = (await getAuthMeSSR()) as { data?: unknown } | null;
    if (!me || !me.data) {
        redirect(ROUTES.LOGIN);
    }

    const queryClient = getQueryClient();
    await Promise.all([
        queryClient
            .prefetchQuery({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES,
                queryFn: async () => {
                    const raw = await getAdminPagesSSR();
                    return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
                },
            })
            .catch(() => undefined),
        queryClient
            .prefetchQuery({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.LOOKUPS,
                queryFn: async () => {
                    const raw = await getAdminLookupsSSR();
                    return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
                },
                staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.staleTime,
            })
            .catch(() => undefined),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {children}
        </HydrationBoundary>
    );
}
