/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Server-side admin authorization guards.
 *
 * These run in Server Components (the admin layout + every admin `page.tsx`)
 * BEFORE any client component mounts, so an unauthorized user is redirected
 * away without the admin page ever rendering or firing its data-loading
 * hooks. This is the authoritative gate; the client `AdminShell` only handles
 * mid-session auth expiry as defense in depth.
 *
 * Permission source: `/auth/user-data` via `getAuthMeSSR` (`cache()`-wrapped,
 * so it shares its single round-trip with `ServerProviders` and the admin
 * layout within one render pass). The permission strings used here mirror the
 * client checks in `permissions.utils.ts` and the admin navbar, so a hidden
 * nav link and a directly typed URL resolve to the same decision.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROUTES } from '../../config/routes.config';
import { AUTH_COOKIE } from '../../config/server.config';
import { PERMISSIONS } from '../../types/auth/jwt-payload.types';
import { getAuthMeSSRResult } from './server-fetch';

/**
 * Resolve the SSR admin authorization decision once, distinguishing three
 * cases so a transient backend outage is never mistaken for a logout:
 *
 *   - `login`       → no auth cookie, or a definitive 4xx / empty envelope
 *                     from `/auth/user-data`: genuinely logged out.
 *   - `unreachable` → the backend is briefly down (5xx / network) while the
 *                     manager restarts Symfony for a plugin / system
 *                     operation. The httpOnly session cookies are intact;
 *                     callers FAIL-OPEN (see `requireAdminAccessSSR`).
 *   - `ok`          → authenticated; carries the user's permission strings
 *                     (`[]` for an authenticated user holding none).
 */
type SsrAccessDecision =
    | { decision: 'login' }
    | { decision: 'unreachable' }
    | { decision: 'ok'; permissions: string[] };

async function resolveSsrAccess(): Promise<SsrAccessDecision> {
    const jar = await cookies();
    if (!jar.get(AUTH_COOKIE)) return { decision: 'login' };

    const result = await getAuthMeSSRResult();
    if (result.status === 'unreachable') return { decision: 'unreachable' };

    const envelope = (result.status === 'ok' ? result.data : null) as
        | { data?: { permissions?: unknown } }
        | null;
    if (!envelope || !envelope.data) return { decision: 'login' };

    const perms = envelope.data.permissions;
    return {
        decision: 'ok',
        permissions: Array.isArray(perms) ? perms.filter((p): p is string => typeof p === 'string') : [],
    };
}

/**
 * Require an authenticated user that can access the admin panel.
 *
 * Redirects to login when unauthenticated and to the no-access page when the
 * user lacks `admin.access`. Returns the permission list so callers can run
 * additional per-page checks without re-fetching.
 *
 * Transient backend outage (`unreachable`): the manager is restarting
 * Symfony for a plugin / system operation, so `/auth/user-data` is briefly
 * answering 5xx / not at all. The session is NOT dead (the httpOnly cookies
 * are intact and the proxy + BFF keep them). Bouncing to login here is
 * exactly the "I got kicked to the login page when I installed a plugin"
 * report. FAIL-OPEN instead: let the admin shell render — the client guard
 * rides out the restart (transient-aware user-data retry) and every admin
 * DATA endpoint independently re-checks permissions server-side once the
 * backend is back, so nothing privileged leaks during the few-second window.
 */
export async function requireAdminAccessSSR(): Promise<string[]> {
    const access = await resolveSsrAccess();

    if (access.decision === 'login') {
        redirect(ROUTES.LOGIN);
    }
    if (access.decision === 'unreachable') {
        return [];
    }
    if (!access.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
        redirect(ROUTES.NO_ACCESS);
    }
    return access.permissions;
}

/**
 * Require admin access plus (optionally) a specific permission for the page.
 *
 * Pass a single permission or a list; a list is satisfied when the user holds
 * ANY of them (matching the navbar's "can read this section" logic). Lacking
 * the permission redirects to the no-access page server-side, so the page's
 * client component — and its data fetch — never mounts.
 *
 * Like `requireAdminAccessSSR`, this fails open during a transient backend
 * outage (`unreachable`) so a plugin / system-update restart does not bounce
 * the operator to login mid-operation.
 */
export async function requireAdminPermission(required?: string | string[]): Promise<void> {
    const access = await resolveSsrAccess();

    if (access.decision === 'login') {
        redirect(ROUTES.LOGIN);
    }
    if (access.decision === 'unreachable') {
        return;
    }
    if (!access.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
        redirect(ROUTES.NO_ACCESS);
    }
    if (!required) return;

    const candidates = Array.isArray(required) ? required : [required];
    if (!candidates.some((permission) => access.permissions.includes(permission))) {
        redirect(ROUTES.NO_ACCESS);
    }
}
