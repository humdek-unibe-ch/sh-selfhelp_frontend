export interface ICreateGroupRequest {
  name: string;
  description?: string;
  id_group_types?: number;
  requires_2fa?: boolean;
  acls?: number[];
}

export interface IUpdateGroupRequest {
  name?: string;
  description?: string;
  id_group_types?: number;
  requires_2fa?: boolean;
  acls?: number[];
}

export interface IUpdateGroupAclsRequest {
  acls: number[];
} 