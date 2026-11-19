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

/** One page the group's members can see. `acl_select: false` is omit/remove. */
export interface IAclRequest {
  page_id: number;
  acl_select?: boolean;
}
