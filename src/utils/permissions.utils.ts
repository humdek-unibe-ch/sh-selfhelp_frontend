import { PERMISSIONS } from '../types/auth/jwt-payload.types';

/**
 * Permission utilities for data access management and admin panel permissions
 */

export interface ICrudPermissions {
  view?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  export?: boolean;
  import?: boolean;
}

export const DEFAULT_CRUD_PERMISSIONS: ICrudPermissions = {
  view: false,
  create: false,
  update: false,
  delete: false,
  export: false,
  import: false,
};

/**
 * Parse CRUD permissions from bitwise number format
 */
export function parseCrudPermissions(permissionsNumber: number): ICrudPermissions {
  return {
    create: (permissionsNumber & 1) !== 0, // CREATE = 1
    view: (permissionsNumber & 2) !== 0,   // READ = 2
    update: (permissionsNumber & 4) !== 0, // UPDATE = 4
    delete: (permissionsNumber & 8) !== 0, // DELETE = 8
    export: false, // Not part of standard CRUD in API
    import: false, // Not part of standard CRUD in API
  };
}

/**
 * Convert CRUD permissions to bitwise number format
 */
export function stringifyCrudPermissions(permissions: ICrudPermissions): number {
  let result = 0;
  if (permissions.create) result |= 1; // CREATE = 1
  if (permissions.view) result |= 2;   // READ = 2
  if (permissions.update) result |= 4; // UPDATE = 4
  if (permissions.delete) result |= 8; // DELETE = 8
  return result;
}

/**
 * Get permission labels for display
 */
export const PERMISSION_LABELS: Record<keyof ICrudPermissions, string> = {
  view: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  export: 'Export',
  import: 'Import',
};

/**
 * Get permission descriptions
 */
export const PERMISSION_DESCRIPTIONS: Record<keyof ICrudPermissions, string> = {
  view: 'Allows viewing/reading the resource',
  create: 'Allows creating new records',
  update: 'Allows modifying existing records',
  delete: 'Allows deleting records',
  export: 'Allows exporting data',
  import: 'Allows importing data',
};

/**
 * Check if any permission is enabled
 */
export function hasAnyPermission(permissions: ICrudPermissions): boolean {
  return Object.values(permissions).some(Boolean);
}

/**
 * Check if all permissions are enabled
 */
export function hasAllPermissions(permissions: ICrudPermissions): boolean {
  return Object.values(permissions).every(Boolean);
}

/**
 * Permission checking utilities for admin panel
 */
export class PermissionChecker {
  private userPermissions: string[];

  constructor(userPermissions: string[]) {
    this.userPermissions = userPermissions || [];
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this.userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(...permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user can access admin panel
   */
  canAccessAdmin(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_ACCESS);
  }

  /**
   * Check if user can manage users
   */
  canManageUsers(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_USER_READ,
      PERMISSIONS.ADMIN_USER_CREATE,
      PERMISSIONS.ADMIN_USER_UPDATE,
      PERMISSIONS.ADMIN_USER_DELETE,
      PERMISSIONS.ADMIN_USER_BLOCK,
      PERMISSIONS.ADMIN_USER_UNBLOCK,
      PERMISSIONS.ADMIN_USER_IMPERSONATE
    );
  }

  /**
   * Check if user can read users
   */
  canReadUsers(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_USER_READ);
  }

  /**
   * Check if user can manage groups
   */
  canManageGroups(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_GROUP_READ,
      PERMISSIONS.ADMIN_GROUP_CREATE,
      PERMISSIONS.ADMIN_GROUP_UPDATE,
      PERMISSIONS.ADMIN_GROUP_DELETE,
      PERMISSIONS.ADMIN_GROUP_ACL
    );
  }

  /**
   * Check if user can read groups
   */
  canReadGroups(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_GROUP_READ);
  }

  /**
   * Check if user can manage roles
   */
  canManageRoles(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_ROLE_READ,
      PERMISSIONS.ADMIN_ROLE_CREATE,
      PERMISSIONS.ADMIN_ROLE_UPDATE,
      PERMISSIONS.ADMIN_ROLE_DELETE,
      PERMISSIONS.ADMIN_ROLE_PERMISSIONS
    );
  }

  /**
   * Check if user can read roles
   */
  canReadRoles(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_ROLE_READ);
  }

  /**
   * Check if user can manage pages
   */
  canManagePages(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_PAGE_READ,
      PERMISSIONS.ADMIN_PAGE_CREATE,
      PERMISSIONS.ADMIN_PAGE_UPDATE,
      PERMISSIONS.ADMIN_PAGE_DELETE,
      PERMISSIONS.ADMIN_PAGE_EXPORT,
      PERMISSIONS.ADMIN_PAGE_INSERT
    );
  }

  /**
   * Check if user can read pages
   */
  canReadPages(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_PAGE_READ);
  }

  /**
   * Check if user can create pages
   */
  canCreatePages(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_PAGE_CREATE);
  }

  /**
   * Check if user can manage assets
   */
  canManageAssets(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_ASSET_READ,
      PERMISSIONS.ADMIN_ASSET_CREATE,
      PERMISSIONS.ADMIN_ASSET_DELETE
    );
  }

  /**
   * Check if user can read assets
   */
  canReadAssets(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_ASSET_READ);
  }

  /**
   * Check if user can manage actions
   */
  canManageActions(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_ACTION_READ,
      PERMISSIONS.ADMIN_ACTION_UPDATE,
      PERMISSIONS.ADMIN_ACTION_DELETE
    );
  }

  /**
   * Check if user can read actions
   */
  canReadActions(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_ACTION_READ);
  }

  /**
   * Check if user can manage scheduled jobs
   */
  canManageScheduledJobs(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_SCHEDULED_JOB_READ,
      PERMISSIONS.ADMIN_SCHEDULED_JOB_EXECUTE,
      PERMISSIONS.ADMIN_SCHEDULED_JOB_DELETE
    );
  }

  /**
   * Check if user can read scheduled jobs
   */
  canReadScheduledJobs(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_READ);
  }

  /**
   * Check if user can manage cache
   */
  canManageCache(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_CACHE_READ,
      PERMISSIONS.ADMIN_CACHE_MANAGE,
      PERMISSIONS.ADMIN_CACHE_CLEAR
    );
  }

  /**
   * Check if user can read cache
   */
  canReadCache(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_CACHE_READ);
  }

  /**
   * Check if user can view audit logs
   */
  canViewAuditLogs(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_AUDIT_VIEW);
  }

  /**
   * Check if user can access data browser
   */
  canAccessDataBrowser(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_DATA_READ);
  }

  /**
   * Check if user can manage CMS preferences
   */
  canManageCmsPreferences(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_CMS_PREFERENCES_READ,
      PERMISSIONS.ADMIN_CMS_PREFERENCES_UPDATE
    );
  }

  /**
   * Check if user can read CMS preferences
   */
  canReadCmsPreferences(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_CMS_PREFERENCES_READ);
  }

  /**
   * Check if user can manage languages
   */
  canManageLanguages(): boolean {
    // Languages are managed through data browser, so we check data permissions
    return this.hasPermission(PERMISSIONS.ADMIN_DATA_READ);
  }

  /**
   * Check if user can manage page versions
   */
  canManagePageVersions(): boolean {
    return this.hasAnyPermission(
      PERMISSIONS.ADMIN_PAGE_VERSION_READ,
      PERMISSIONS.ADMIN_PAGE_VERSION_CREATE,
      PERMISSIONS.ADMIN_PAGE_VERSION_PUBLISH,
      PERMISSIONS.ADMIN_PAGE_VERSION_UNPUBLISH,
      PERMISSIONS.ADMIN_PAGE_VERSION_COMPARE
    );
  }

  /**
   * Check if user can read page versions
   */
  canReadPageVersions(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_PAGE_VERSION_READ);
  }

  /**
   * Check if user can delete sections
   */
  canDeleteSections(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_SECTION_DELETE);
  }

  /**
   * Check if user has access to settings
   */
  canAccessSettings(): boolean {
    return this.hasPermission(PERMISSIONS.ADMIN_SETTINGS);
  }
}

/**
 * Create a permission checker instance for a user
 */
export function createPermissionChecker(userPermissions: string[]): PermissionChecker {
  return new PermissionChecker(userPermissions);
}
