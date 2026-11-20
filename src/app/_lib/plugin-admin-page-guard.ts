/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Server-side guard for a plugin admin page (rule 4.13).
 *
 * A plugin admin page declares one permission in its manifest; the backend
 * refuses a manifest whose page permission the plugin does not declare. The
 * page opens only for users who hold it, checked here before any client
 * component mounts, so a typed URL gets the same answer as the menu.
 *
 * - Page found: `admin.access` plus the page's permission, else no-access.
 * - Manifest read but no such plugin / slug: only the `admin.access`
 *   baseline; the host route shows its "page not available" state.
 * - Manifest unreachable (`null`): same baseline, matching the other admin
 *   guards that fail open while the backend restarts. Plugin API routes
 *   check their own permissions.
 */
import { requireAdminPermission } from './admin-guard';
import { getPluginManifestSSR } from './server-fetch';

interface IManifestAdminPage {
    slug?: unknown;
    permission?: unknown;
}

interface IManifestPlugin {
    pluginId?: unknown;
    adminPages?: unknown;
}

/** The permission a plugin's admin page declares, or `null` when the manifest has no such page. */
export function findPluginAdminPagePermission(
    manifest: unknown,
    pluginId: string,
    slug: string,
): string | null {
    const envelope = manifest as { data?: { plugins?: unknown } } | null;
    const plugins = envelope?.data?.plugins;
    if (!Array.isArray(plugins)) return null;

    for (const plugin of plugins as IManifestPlugin[]) {
        if (plugin?.pluginId !== pluginId || !Array.isArray(plugin.adminPages)) continue;
        for (const page of plugin.adminPages as IManifestAdminPage[]) {
            if (page?.slug === slug && typeof page.permission === 'string' && page.permission !== '') {
                return page.permission;
            }
        }
    }
    return null;
}

/** Require admin access plus the permission the plugin declares for this admin page. */
export async function requirePluginAdminPageAccess(pluginId: string, slug: string): Promise<void> {
    const permission = findPluginAdminPagePermission(await getPluginManifestSSR(), pluginId, slug);
    await requireAdminPermission(permission ?? undefined);
}
