/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { IAclPage } from '../app/components/cms/groups/advanced-acl-modal/AdvancedAclModal';
import type { IAclRequest } from '../types/requests/admin/groups.types';
import type { IGroupPageAcl } from '../types/responses/admin/groups.types';

/**
 * Convert UI ACL format to API request format (C1: page_id + acl_select only).
 */
export function convertAclsToApiFormat(pages: IAclPage[]): IAclRequest[] {
  return pages
    .filter(page => page.permissions.select)
    .map(page => ({
      page_id: page.id,
      acl_select: true,
    }));
}

/**
 * Convert API response format to UI ACL format.
 */
export function convertApiAclsToUiFormat(acls: IGroupPageAcl[]): IAclPage[] {
  return acls
    .filter(acl => acl.acl_select)
    .map(acl => ({
      id: acl.page_id,
      keyword: acl.page_keyword || '',
      title: acl.page_title || null,
      type: acl.page_type || 3,
      isSystem: acl.is_system || false,
      isConfiguration: acl.is_configuration || false,
      permissions: {
        select: true,
      },
    }));
}
