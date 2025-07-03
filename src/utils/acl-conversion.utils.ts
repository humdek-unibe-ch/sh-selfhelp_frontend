import type { IAclPage } from '../app/components/admin/groups/advanced-acl-modal/AdvancedAclModal';
import type { IAclRequest } from '../types/requests/admin/groups.types';
import type { IGroupPageAcl } from '../types/responses/admin/groups.types';

/**
 * Convert UI ACL format to API request format
 */
export function convertAclsToApiFormat(pages: IAclPage[]): IAclRequest[] {
  return pages.map(page => ({
    page_id: page.id,
    acl_select: page.permissions.select,
    acl_insert: page.permissions.insert,
    acl_update: page.permissions.update,
    acl_delete: page.permissions.delete,
  }));
}

/**
 * Convert API response format to UI ACL format
 */
export function convertApiAclsToUiFormat(acls: IGroupPageAcl[]): IAclPage[] {
  return acls.map(acl => ({
    id: acl.page_id,
    keyword: acl.page_keyword || '',
    title: acl.page_title || null,
    type: acl.page_type || 3,
    isSystem: acl.is_system || false,
    isConfiguration: acl.is_configuration || false,
    permissions: {
      select: acl.acl_select || false,
      insert: acl.acl_insert || false,
      update: acl.acl_update || false,
      delete: acl.acl_delete || false,
    },
  }));
} 