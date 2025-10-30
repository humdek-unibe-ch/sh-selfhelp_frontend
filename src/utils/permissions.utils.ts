/**
 * Permission utilities for data access management
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
