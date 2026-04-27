/**
 * Refine AuthProvider — cookie-driven.
 *
 * Auth state lives in httpOnly cookies managed by the BFF; Refine's
 * lifecycle methods call the BFF catch-all (`/api/auth/user-data`) which
 * also handles silent refresh. UI code should prefer the `useAuthUser`
 * hook; Refine still uses this provider for initial guard decisions.
 *
 * `check()` and `getIdentity()` share the `['user-data']` React Query
 * cache with `useAuthUser`, so a hydrated cache serves Refine's first
 * guard with zero XHR, and cold reads dedupe via `fetchQuery` into the
 * same slot the hook observes.
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
import { getQueryClient } from './query-client';

const PENDING_2FA_KEY = 'pending_2fa_user_id';

/**
 * Resolve the current user from the shared `['user-data']` cache, falling
 * back to a network fetch only when the slot is cold or stale. Any non-ok
 * response (including a refresh failure surfaced by the BFF) is treated as
 * "not logged in" so Refine redirects to `/auth/login`.
 */
async function fetchMeOrNull(): Promise<IUserData | null> {
    try {
        const envelope = await getQueryClient().fetchQuery<IUserDataResponse>({
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

            // Replace the cached anonymous sentinel with the real envelope
            // BEFORE redirecting. The login page has no `AuthButton` mounted
            // (no active observers to wake via `invalidateQueries`) and
            // `useUserData` is `refetchOnMount: false`, so we proactively
            // seed the slot to avoid a "Login → Login → User" flash.
            const qc = getQueryClient();
            qc.removeQueries({
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
            });
            try {
                await qc.fetchQuery({
                    queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
                    queryFn: () => AuthApi.getUserData(),
                    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.USER_DATA.staleTime,
                });
            } catch (fetchErr) {
                warn('Post-login user-data prefetch failed', 'AuthProvider', fetchErr);
            }
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
        // Evict the cached envelope so the next `check()` resolves to
        // "not authenticated" immediately, without waiting for observers
        // to invalidate (avoids stale admin navbar after logout).
        getQueryClient().removeQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
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

