/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';

interface IPermissionHolder {
    hasPermission(permission: string): boolean;
}

/**
 * F238 / brief P8 step 4: Plugins-screen control rights.
 * - execute: enable, disable, uninstall, repair, repair all, source update/delete, safe mode
 * - manage: inspect archive and settings
 * - purge: separate purge right
 */
export function pluginAdminRights(checker: IPermissionHolder | null | undefined) {
    return {
        canManage: checker?.hasPermission(PERMISSIONS.ADMIN_PLUGINS_MANAGE) ?? false,
        canExecute: checker?.hasPermission(PERMISSIONS.ADMIN_PLUGINS_EXECUTE) ?? false,
        canPurge: checker?.hasPermission(PERMISSIONS.ADMIN_PLUGINS_PURGE) ?? false,
    };
}
