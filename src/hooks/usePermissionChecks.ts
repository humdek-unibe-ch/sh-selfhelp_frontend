/**
 * Centralized permission checking hooks
 * Uses the PermissionChecker class from permissions.utils.ts for consistent permission checking
 * across the entire application
 *
 * @module hooks/usePermissionChecks
 */

import { useAuth } from './useAuth';

/**
 * Hook to check if user can access admin panel
 */
export function useCanAccessAdmin(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canAccessAdmin() ?? false;
}

/**
 * User Management Permissions
 */
export function useCanManageUsers(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManageUsers() ?? false;
}

export function useCanReadUsers(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadUsers() ?? false;
}

export function useCanCreateUsers(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canCreateUsers() ?? false;
}

export function useCanUpdateUsers(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canUpdateUsers() ?? false;
}

export function useCanDeleteUsers(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canDeleteUsers() ?? false;
}

export function useCanBlockUsers(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canBlockUsers() ?? false;
}

export function useCanUnblockUsers(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canUnblockUsers() ?? false;
}

export function useCanImpersonateUsers(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canImpersonateUsers() ?? false;
}

/**
 * Group Management Permissions
 */
export function useCanManageGroups(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManageGroups() ?? false;
}

export function useCanReadGroups(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadGroups() ?? false;
}

/**
 * Role Management Permissions
 */
export function useCanManageRoles(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManageRoles() ?? false;
}

export function useCanReadRoles(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadRoles() ?? false;
}

/**
 * Page Management Permissions
 */
export function useCanManagePages(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManagePages() ?? false;
}

export function useCanReadPages(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadPages() ?? false;
}

export function useCanCreatePages(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canCreatePages() ?? false;
}

/**
 * Asset Management Permissions
 */
export function useCanManageAssets(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManageAssets() ?? false;
}

export function useCanReadAssets(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadAssets() ?? false;
}

/**
 * Action Management Permissions
 */
export function useCanManageActions(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManageActions() ?? false;
}

export function useCanReadActions(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadActions() ?? false;
}

/**
 * Scheduled Jobs Permissions
 */
export function useCanManageScheduledJobs(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManageScheduledJobs() ?? false;
}

export function useCanReadScheduledJobs(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadScheduledJobs() ?? false;
}

/**
 * Cache Management Permissions
 */
export function useCanManageCache(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManageCache() ?? false;
}

export function useCanReadCache(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadCache() ?? false;
}

/**
 * Audit Logs Permission
 */
export function useCanViewAuditLogs(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canViewAuditLogs() ?? false;
}

/**
 * Data Browser Permission
 */
export function useCanAccessDataBrowser(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canAccessDataBrowser() ?? false;
}

/**
 * CMS Preferences Permissions
 */
export function useCanManageCmsPreferences(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManageCmsPreferences() ?? false;
}

export function useCanReadCmsPreferences(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadCmsPreferences() ?? false;
}

/**
 * Language Management Permission
 */
export function useCanManageLanguages(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManageLanguages() ?? false;
}

/**
 * Page Version Permissions
 */
export function useCanManagePageVersions(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canManagePageVersions() ?? false;
}

export function useCanReadPageVersions(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canReadPageVersions() ?? false;
}

/**
 * Section Permissions
 */
export function useCanDeleteSections(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canDeleteSections() ?? false;
}

/**
 * Settings Permission
 */
export function useCanAccessSettings(): boolean {
  const { permissionChecker } = useAuth();
  return permissionChecker?.canAccessSettings() ?? false;
}
