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
import { getAuthMeSSR } from './server-fetch';

/**
 * Resolve the current user's permission strings during SSR.
 *
 * Returns `null` when there is no auth cookie or the user-data envelope is
 * empty/invalid (treated by callers as "not logged in"). Returns `[]` for an
 * authenticated user that simply holds no permissions.
 */
async function readPermissionsSSR(): Promise<string[] | null> {
    const jar = await cookies();
    if (!jar.get(AUTH_COOKIE)) return null;

    const me = (await getAuthMeSSR()) as { data?: { permissions?: unknown } } | null;
    if (!me || !me.data) return null;

    const perms = me.data.permissions;
    return Array.isArray(perms) ? perms.filter((p): p is string => typeof p === 'string') : [];
}

/**
 * Require an authenticated user that can access the admin panel.
 *
 * Redirects to login when unauthenticated and to the no-access page when the
 * user lacks `admin.access`. Returns the permission list so callers can run
 * additional per-page checks without re-fetching.
 */
export async function requireAdminAccessSSR(): Promise<string[]> {
    const permissions = await readPermissionsSSR();
    if (permissions === null) {
        redirect(ROUTES.LOGIN);
    }
    if (!permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
        redirect(ROUTES.NO_ACCESS);
    }
    return permissions;
}

/**
 * Require admin access plus (optionally) a specific permission for the page.
 *
 * Pass a single permission or a list; a list is satisfied when the user holds
 * ANY of them (matching the navbar's "can read this section" logic). Lacking
 * the permission redirects to the no-access page server-side, so the page's
 * client component — and its data fetch — never mounts.
 */
export async function requireAdminPermission(required?: string | string[]): Promise<void> {
    const permissions = await requireAdminAccessSSR();
    if (!required) return;

    const candidates = Array.isArray(required) ? required : [required];
    if (!candidates.some((permission) => permissions.includes(permission))) {
        redirect(ROUTES.NO_ACCESS);
    }
}
