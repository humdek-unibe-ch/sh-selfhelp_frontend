/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Reacts to auth transitions broadcast by sibling tabs of the SAME browser
 * (see `utils/auth-broadcast.ts`) so a login/logout in one tab is reflected in
 * the others within a tick — without waiting for the next 401 or SSE drop.
 *
 *   - `logged-out` → drop the cached user envelope + permissions so the shell
 *     repaints as anonymous, and bounce to login when sitting on a protected
 *     `/admin` page (mirrors `authProvider.logout` and the Axios 401 handler).
 *   - `logged-in`  → invalidate `['user-data']` so this tab refetches and
 *     adopts the freshly authenticated session.
 *
 * Mount once at the root of the client tree (`RefineWrapper`), next to
 * `useAclEventStream` / `useAclVersionWatcher`. No-op on the server and where
 * `BroadcastChannel` is unavailable.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeAuthBroadcast } from '../utils/auth-broadcast';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { permissionManager } from '../api/permission-wrapper.api';
import { ROUTES } from '../config/routes.config';

function shouldRedirectToLogin(pathname: string): boolean {
    if (!pathname.startsWith('/admin')) return false;
    if (pathname.startsWith(ROUTES.LOGIN)) return false;
    if (pathname.startsWith(ROUTES.NO_ACCESS)) return false;
    return true;
}

export function useAuthBroadcastSync(): void {
    const queryClient = useQueryClient();
    const router = useRouter();

    useEffect(() => {
        return subscribeAuthBroadcast((message) => {
            if (message.type === 'logged-out') {
                permissionManager.clearPermissions();
                queryClient.removeQueries({
                    queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
                });
                if (
                    typeof window !== 'undefined' &&
                    shouldRedirectToLogin(window.location.pathname)
                ) {
                    const currentPath = window.location.pathname + window.location.search;
                    router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentPath)}`);
                }
            } else {
                // logged-in elsewhere: refetch so this tab adopts the session.
                void queryClient.invalidateQueries({
                    queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
                });
            }
        });
    }, [queryClient, router]);
}
