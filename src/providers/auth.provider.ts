/**
 * Refine AuthProvider — cookie-driven.
 *
 * All authentication state now lives in httpOnly cookies managed by the BFF.
 * Refine's lifecycle methods call the BFF catch-all (`/api/auth/user-data`)
 * rather than poking `localStorage`; the catch-all handles silent refresh
 * transparently so no dedicated "me" handler is needed. The UI should prefer
 * the `useAuthUser` hook for reactive user data; Refine still uses this
 * provider for initial guard decisions on admin routes.
 *
 * Caching: `check()` and `getIdentity()` share the same `['user-data']`
 * React Query cache as `useAuthUser` (via the module-level `queryClient`
 * singleton in `providers/query-client.ts`). This means a warm SSR-hydrated
 * cache serves Refine's first guard decision without any XHR, and cold
 * cache entries are filled via `queryClient.fetchQuery`, which dedupes
 * concurrent callers and publishes the result into the same cache slot the
 * hook reads from.
 */

import { AuthProvider } from '@refinedev/core';
import { ILoginRequest } from '../types/requests/auth/auth.types';
import { AuthApi } from '../api/auth.api';
import { ITwoFactorRequiredResponse } from '../types/responses/auth.types';
import type { IUserDataResponse, IUserData } from '../types/auth/jwt-payload.types';
import { ROUTES } from '../config/routes.config';
import { info, warn, error } from '../utils/debug-logger';
import { permissionManager } from '../api/permission-wrapper.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { queryClient } from './query-client';

const PENDING_2FA_KEY = 'pending_2fa_user_id';

/**
 * Resolve the current user, preferring the hydrated `['user-data']` React
 * Query cache and only firing a network request when the cache is cold /
 * stale. Shares the cache slot with `useAuthUser` so one network round-trip
 * per page load serves Refine's guards, the admin navbar, and every
 * permission check.
 *
 * Silent refresh on 401 is still handled by the catch-all (see
 * `src/app/api/[...path]/route.ts`). Any non-ok response is treated as
 * "not logged in" so Refine can redirect to `/auth/login`.
 */
async function fetchMeOrNull(): Promise<IUserData | null> {
    try {
        const envelope = await queryClient.fetchQuery<IUserDataResponse>({
            queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
            queryFn: () => AuthApi.getUserData(),
            staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.USER_DATA.staleTime,
            gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.USER_DATA.gcTime,
            retry: false,
        });
        return envelope?.data ?? null;
    } catch {
        return null;
    }
}

export const authProvider: AuthProvider = {
    login: async ({ email, password }: ILoginRequest) => {
        try {
            const response = await AuthApi.login({ email, password });

            if ('requires_2fa' in response.data) {
                const twoFactorData = response as ITwoFactorRequiredResponse;
                if (typeof window !== 'undefined') {
                    localStorage.setItem(PENDING_2FA_KEY, twoFactorData.data.id_users.toString());
                }
                return {
                    success: false,
                    error: { message: 'Two-factor authentication required', name: '2FA Required' },
                    redirectTo: ROUTES.TWO_FACTOR_AUTH,
                };
            }

            // Force the next `check()` (or any `useAuthUser` consumer) to
            // fetch fresh user data for the newly authenticated session.
            queryClient.removeQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
            info('Login successful', 'AuthProvider');
            return { success: true, redirectTo: ROUTES.HOME };
        } catch (apiError: any) {
            error('Login error', 'AuthProvider', apiError);
            return {
                success: false,
                error: { message: apiError?.message || 'Login failed', name: 'Login Error' },
            };
        }
    },

    logout: async () => {
        try {
            await AuthApi.logout();
            if (typeof window !== 'undefined') {
                localStorage.removeItem(PENDING_2FA_KEY);
            }
            permissionManager.clearPermissions();
            info('Logout successful', 'AuthProvider');
        } catch (err: any) {
            warn('Logout error', 'AuthProvider', err);
            permissionManager.clearPermissions();
        }
        // Evict the cached user envelope so the next `check()` resolves to
        // "not authenticated" without waiting for the React Query observers
        // to invalidate. This also prevents stale admin navbar items from
        // lingering for a tick after logout.
        queryClient.removeQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
        return { success: true, redirectTo: ROUTES.LOGIN };
    },

    check: async () => {
        const pending2fa = typeof window !== 'undefined' ? localStorage.getItem(PENDING_2FA_KEY) : null;
        if (pending2fa) {
            return {
                authenticated: false,
                error: { message: '2FA verification required', name: 'Not fully authenticated' },
                redirectTo: ROUTES.TWO_FACTOR_AUTH,
            };
        }

        const me = await fetchMeOrNull();
        if (!me) {
            return {
                authenticated: false,
                error: { message: 'Not authenticated', name: 'Not authenticated' },
            };
        }
        return { authenticated: true };
    },

    getIdentity: async () => {
        const me = await fetchMeOrNull();
        if (!me) return null;
        return {
            id: me.id,
            name: me.name || me.user_name || me.email,
            email: me.email,
        };
    },

    onError: async (err) => {
        if (err.response?.status === 401 && !err.config?._retry) {
            return { error: err };
        }
        return { error: err };
    },
};

