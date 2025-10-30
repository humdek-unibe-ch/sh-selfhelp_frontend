/**
 * Audit Management Types
 * Types for data access audit logs and statistics
 */

export interface IAuditLogUser {
  id: number;
  username: string;
  email: string;
}

export interface IAuditLogResourceType {
  id: number;
  lookupCode: string;
  lookupValue: string;
  typeCode: string;
}

export interface IAuditLogAction {
  id: number;
  lookupCode: string;
  lookupValue: string;
  typeCode: string;
}

export interface IAuditLogPermissionResult {
  id: number;
  lookupCode: string;
  lookupValue: string;
  typeCode: string;
}

export interface IAuditLogDetails {
  id: number;
  idUsers: number;
  idResourceTypes: number;
  resourceId: number;
  idActions: number;
  idPermissionResults: number;
  crudPermission: number | null;
  httpMethod: string;
  requestBodyHash: string | null;
  ipAddress: string;
  userAgent: string | null;
  requestUri: string;
  notes: string | null;
  createdAt: string;
  user: IAuditLogUser;
  resourceType: IAuditLogResourceType;
  action: IAuditLogAction;
  permissionResult: IAuditLogPermissionResult;
}

export interface IAuditLogsListResponse {
  data: IAuditLogDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IAuditLogStatsResponse {
  totalLogs: number;
  deniedAttempts: number;
  uniqueResources: number;
  uniqueUsers: number;
  mostAccessedResources: Array<{
    resourceType: string;
    resourceId: number;
    accessCount: number;
  }>;
  recentDeniedAttempts: IAuditLogDetails[];
}

export interface IAuditLogsListParams {
  user_id?: number;
  resource_type?: string;
  action?: string;
  permission_result?: string;
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  http_method?: string;
  page?: number;
  pageSize?: number;
}

export interface IAuditStatsParams {
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
}
