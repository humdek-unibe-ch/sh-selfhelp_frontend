/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Base Axios client.
 *
 * See `docs/architecture/ssr-bff-architecture.md` §4 for the bigger
 * picture (why Axios stays, why it never attaches `Authorization`, and
 * how it complements the BFF silent-refresh loop).
 *
 * After the full BFF migration this client only ever talks to the local
 * Next.js `/api/*` proxy. The browser never sees the JWT; access &
 * refresh tokens, AND the impersonation JWT, live in httpOnly cookies
 * that the proxy rotates on our behalf.
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
 *   2. `withCredentials: true` so the httpOnly auth/impersonation cookies
 *      are sent automatically.
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
 * Note on impersonation: this client never reads, writes, or even sees
 * the `sh_impersonate` cookie. It is httpOnly, only the BFF proxy
 * forwards it, and only the dedicated `/api/admin/users/.../impersonate`
 * + `/api/admin/users/stop-impersonate` BFF routes ever set/clear it.
 *
 * @module api/base.api
 */

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api.config';
import { ROUTES } from '../config/routes.config';
import { readCookieValue } from '../utils/auth.utils';
import { CSRF_COOKIE } from '../config/cookie-names';
import { isTransientApiError, transientRetryDelay } from '../utils/transient-error.utils';
import { withRedirectTo } from '../utils/login-redirect.utils';
import { observeAclStampHeader } from '../utils/acl-stamp.utils';
import {
    HEADER_PAGE_VERSION,
    adminPageIdOfUrl,
    draftWritePageId,
    enterPageDraftWrite,
    rememberPageDraftVersion,
    rememberPageDraftVersionFromHeaders,
    resolvePageDraftVersion,
} from '../utils/page-draft-version.utils';
import { clearStaleConflict, notifyPageEditConflict } from '../utils/page-edit-conflict.utils';
import { PAGE_LOCKED_ERROR, STALE_PAGE_VERSION_ERROR, type IPageLockStatus } from '@selfhelp/shared';

declare module 'axios' {
    export interface InternalAxiosRequestConfig {
        _retry?: boolean;
        _transientRetryCount?: number;
        /** Lets the next draft write of the same page leave (page draft version, C8). */
        _releasePageWrite?: () => void;
    }
}

/** Safe (idempotent, body-less) methods we may transparently retry. */
const SAFE_METHODS = new Set(['get', 'head', 'options']);

/**
 * How many times a SAFE request is retried while the backend is briefly
 * unavailable (a manager-driven service restart during a plugin/system
 * operation). Short by design — React Query adds its own longer transient
 * retry on top for reads, and the SSE reconnect reconciles anything missed.
 */
const MAX_TRANSIENT_RETRIES = 3;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
    async (config) => {
        const method = (config.method || 'get').toLowerCase();
        if (UNSAFE_METHODS.has(method)) {
            const csrf = readCookieValue(CSRF_COOKIE);
            if (csrf) {
                config.headers.set('X-CSRF-Token', csrf);
            }
        }
        // Draft write of a page (C8): wait for the page's earlier write, then name the version
        // the draft has now. The release function runs in the response interceptors.
        const draftPageId = draftWritePageId(method, config.url);
        if (draftPageId !== null) {
            config._releasePageWrite = await enterPageDraftWrite(draftPageId);
            const version = await resolvePageDraftVersion(draftPageId);
            if (version !== undefined) {
                config.headers.set(HEADER_PAGE_VERSION, String(version));
            }
        }
        // FormData must carry its own multipart boundary. The default
        // `Content-Type: application/json` (and any forced `multipart/form-data`
        // without a boundary) makes the BFF/PHP drop later parts — F173: news
        // `status` after file parts arrived empty while the select showed Draft.
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            config.headers.delete('Content-Type');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

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

/**
 * What a reply under `/admin/pages/<id>` tells the page editor (C8, C9): the new draft version, a
 * stale or locked refusal, and the end of this write's place in the page's line.
 */
function observePageDraftReply(
    config: InternalAxiosRequestConfig | undefined,
    headers: unknown,
    succeeded: boolean,
    status?: number,
    body?: unknown,
): void {
    if (!config) {
        return;
    }
    config._releasePageWrite?.();
    config._releasePageWrite = undefined;

    const pageId = adminPageIdOfUrl(config.url);
    if (pageId === null) {
        return;
    }
    rememberPageDraftVersionFromHeaders(pageId, headers);
    const isDraftWrite = draftWritePageId(config.method, config.url) !== null;

    if (succeeded) {
        if (isDraftWrite) {
            // The write went through: the inspectors follow the server again.
            clearStaleConflict(pageId);
        }
        return;
    }
    if (!isDraftWrite || status !== 409 || !body || typeof body !== 'object') {
        return;
    }
    const envelope = body as { error?: unknown; data?: unknown };
    if (envelope.error === STALE_PAGE_VERSION_ERROR) {
        const data = envelope.data as { current_version?: unknown } | null | undefined;
        const current = typeof data?.current_version === 'number' ? data.current_version : null;
        if (current !== null) {
            rememberPageDraftVersion(pageId, current, true);
        }
        notifyPageEditConflict({ kind: 'stale', pageId, currentVersion: current });
    } else if (envelope.error === PAGE_LOCKED_ERROR) {
        notifyPageEditConflict({ kind: 'locked', pageId, status: (envelope.data as IPageLockStatus | null) ?? null });
    }
}

apiClientRaw.interceptors.response.use(
    (response) => {
        // Lost-push backstop (C5): a reply whose access stamp differs from the user data's means
        // the access changed behind this tab's back.
        observeAclStampHeader(response.headers);
        observePageDraftReply(response.config, response.headers, true);
        return response;
    },
    async (error) => {
        observeAclStampHeader(error.response?.headers);
        observePageDraftReply(error.config, error.response?.headers, false, error.response?.status, error.response?.data);
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

        // (a2) Transient backend outage on a SAFE read (network error / 5xx —
        //      e.g. Traefik 502/503 while the manager restarts Symfony for a
        //      plugin/system operation). Retry a few times with backoff so the
        //      restart window is invisible. NEVER retry mutations (not
        //      idempotent) and never treat this as a logout (5xx is not a 401).
        if (
            originalRequest &&
            SAFE_METHODS.has((originalRequest.method || 'get').toLowerCase()) &&
            isTransientApiError(error)
        ) {
            const attempt = originalRequest._transientRetryCount ?? 0;
            if (attempt < MAX_TRANSIENT_RETRIES) {
                originalRequest._transientRetryCount = attempt + 1;
                await sleep(transientRetryDelay(attempt));
                return apiClientRaw(originalRequest);
            }
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
                window.location.href = withRedirectTo(ROUTES.LOGIN, path);
            }
        }

        return Promise.reject(error);
    }
);

import { initializePermissionChecking } from './permission-wrapper.api';
import { permissionAwareApiClient } from './permission-aware-client.api';

initializePermissionChecking(apiClient);

export { permissionAwareApiClient };
