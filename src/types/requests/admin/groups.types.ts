/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface ICreateGroupRequest {
  name: string;
  description?: string;
  add_to_new_pages?: boolean;
  requires_2fa?: boolean;
  acls?: IAclRequest[];
}

export interface IUpdateGroupRequest {
  name?: string;
  description?: string;
  add_to_new_pages?: boolean;
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