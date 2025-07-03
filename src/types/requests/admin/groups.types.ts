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