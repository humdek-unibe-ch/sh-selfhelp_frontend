/**
 * Base Axios client.
 *
 * See `docs/architecture/ssr-bff-architecture.md` §4 for the bigger
 * picture (why Axios stays, why it never attaches `Authorization`, and
 * how it complements the BFF silent-refresh loop).
 *
 * After the full BFF migration this client only ever talks to the local
 * Next.js `/api/*` proxy. The browser never sees the JWT; access & refresh
 * tokens live in httpOnly cookies that the proxy rotates on our behalf.
 *
 * Why still Axios (vs. raw `fetch`)?
 * - Interceptors give us a single choke point for CSRF header attachment,
 *   response-denied redirects, and "session expired → go to login".
 * - Every domain client under `src/api/` already uses the Axios type
 *   surface. Replacing with fetch would be a pure renaming refactor
 *   with no behavioural win.
 * - We depend on `axios.isAxiosError`, `AxiosResponse<T>`, and the shape
 *   of `InternalAxiosRequestConfig` across dozens of call sites.
 *
 * Responsibilities:
 *   1. `baseURL = '/api'` so every call is relative to the current origin.
 *   2. `withCredentials: true` so the httpOnly auth cookies are sent.
 *   3. Attach `X-CSRF-Token` on unsafe methods from the `sh_csrf` cookie.
 *   4. Transparent retry exactly once when the BFF signals a refresh
 *      succeeded mid-flight (`401` + `logged_in: true`). This is the
 *      client-side complement of the proxy's silent-refresh loop; it
 *      handles the (rare) mutation race where the proxy rotated cookies
 *      but chose to surface the original 401 to the caller.
 *   5. Session-expired redirect: when the BFF returns `401` with
 *      `logged_in: false` from a route under `/admin/*`, send the user
 *      to the login page with a `redirect=` hint.
 *   6. Permission-denied redirect for admin *non-data* operations.
 *
 * @module api/base.api
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { ROUTES } from '../config/routes.config';
import { readCsrfToken } from '../utils/auth.utils';

declare module 'axios' {
    export interface InternalAxiosRequestConfig {
        _retry?: boolean;
    }
}

const apiClientRaw = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Client-Type': 'web',
    },
});

export const apiClient = apiClientRaw;

const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

apiClientRaw.interceptors.request.use(
    (config) => {
        const method = (config.method || 'get').toLowerCase();
        if (UNSAFE_METHODS.has(method)) {
            const csrf = readCsrfToken();
            if (csrf) {
                config.headers.set('X-CSRF-Token', csrf);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

function isAdminDataOperation(url: string | undefined): boolean {
    if (!url) return false;
    const dataOperationPatterns = [
        '/admin/pages/',
        '/admin/sections/',
        '/admin/roles/',
        '/admin/users/',
        '/admin/groups/',
        '/admin/assets/',
        '/admin/actions/',
        '/admin/data/',
        '/admin/scheduled-jobs/',
    ];
    return dataOperationPatterns.some((p) => url.includes(p));
}

/**
 * True for paths where a dead session *must* bounce to the login page
 * (admin UI). Public / login / no-access paths never bounce — the UI on
 * those pages can legitimately receive a 401 from `/auth/user-data` while
 * sitting on the landing screen without it being an error.
 */
function shouldRedirectToLogin(pathname: string): boolean {
    if (!pathname.startsWith('/admin')) return false;
    if (pathname.startsWith(ROUTES.LOGIN)) return false;
    if (pathname.startsWith(ROUTES.NO_ACCESS)) return false;
    return true;
}

apiClientRaw.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const responseData = error.response?.data;

        // (a) Silent-refresh race: the proxy has already rotated cookies
        //     and is telling us to retry.
        if (
            status === 401 &&
            responseData?.logged_in === true &&
            originalRequest &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;
            return apiClientRaw(originalRequest);
        }

        // (b) Session genuinely expired. The proxy cleared cookies; if we
        //     are on a page that requires auth, bounce to login with a
        //     redirect hint. Public pages see the 401 and continue as
        //     anonymous (e.g. `/auth/user-data` returning null is fine on `/`).
        if (
            status === 401 &&
            responseData?.logged_in === false &&
            typeof window !== 'undefined'
        ) {
            const path = window.location.pathname + window.location.search;
            if (shouldRedirectToLogin(window.location.pathname)) {
                const loginUrl = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(path)}`;
                window.location.href = loginUrl;
            }
        }

        // (c) Permission denied for an admin *non-data* operation. Data
        //     operations surface the error so the caller can show an
        //     inline message; navigation / list fetches bounce to
        //     /no-access so the user isn't stuck on an empty shell.
        if (
            status === 403 &&
            responseData?.logged_in === true &&
            responseData?.error_type === 'permission_denied' &&
            originalRequest?.url?.includes('/admin/') &&
            !isAdminDataOperation(originalRequest.url)
        ) {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith(ROUTES.NO_ACCESS)) {
                window.location.href = ROUTES.NO_ACCESS;
            }
        }

        return Promise.reject(error);
    }
);

import { initializePermissionChecking } from './permission-wrapper.api';
import { permissionAwareApiClient } from './permission-aware-client.api';

initializePermissionChecking(apiClient);

export { permissionAwareApiClient };
