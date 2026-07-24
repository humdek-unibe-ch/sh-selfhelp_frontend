/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface ICreateGroupRequest {
  name: string;
  description?: string;
  id_group_types?: number;
  requires_2fa?: boolean;
  acls?: IAclRequest[];
}

export interface IUpdateGroupRequest {
  name?: string;
  description?: string;
  id_group_types?: number;
  requires_2fa?: boolean;
  acls?: IAclRequest[];
}

export interface IUpdateGroupAclsRequest {
  acls: IAclRequest[];
}

export interface IAclRequest {
  page_id: number;
  acl_select?: boolean;
  acl_insert?: boolean;
  acl_update?: boolean;
  acl_delete?: boolean;
}

/** One folder grant sent when replacing a group's asset-folder ACLs. */
export interface IGroupAssetAclRequest {
  folder: string;
  access_level: 'read' | 'manage';
}

/** PUT /admin/groups/{id}/asset-acls body — full replacement of the group's folder grants. */
export interface IUpdateGroupAssetAclsRequest {
  /** Empty array clears all asset-folder access for the group. */
  acls: IGroupAssetAclRequest[];
} 