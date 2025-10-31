import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import type {
  IRoleDataAccessPermissions,
  IRoleEffectivePermissions,
  ISetRolePermissionsRequest,
  ISetRolePermissionsResponse
} from '../../types/responses/admin/roles.types';
import type {
  IAuditLogsListResponse,
  IAuditLogDetails,
  IAuditLogStatsResponse,
  IAuditLogsListParams,
  IAuditStatsParams
} from '../../types/responses/admin/audit.types';
import type { IAdminPage } from '../../types/responses/admin/admin.types';
import type { IDataTableSummary, IDataTablesListResponse } from '../../types/responses/admin/data.types';
import type { IGroupDetails, IGroupsListResponse } from '../../types/responses/admin/groups.types';

export const AdminDataAccessApi = {
  /**
   * Get all roles with their data access permissions
   */
  async getRolesWithPermissions(): Promise<IRoleDataAccessPermissions[]> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IRoleDataAccessPermissions[]>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_ACCESS_ROLES_LIST);
    return response.data.data;
  },

  /**
   * Get effective permissions for a specific role
   */
  async getRoleEffectivePermissions(roleId: number): Promise<IRoleEffectivePermissions> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IRoleEffectivePermissions>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_ACCESS_ROLE_EFFECTIVE_PERMISSIONS, roleId);
    return response.data.data;
  },

  /**
   * Set all permissions for a role in a single bulk operation
   * This replaces all existing permissions for the role with the provided set.
   * Send an empty array to remove all permissions.
   */
  async setRolePermissions(roleId: number, permissionData: ISetRolePermissionsRequest): Promise<ISetRolePermissionsResponse> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<ISetRolePermissionsResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_ACCESS_ROLE_PERMISSIONS_SET,  permissionData, roleId);
    return response.data.data;
  },

  /**
   * Get all available pages for permission management
   */
  async getAvailablePages(): Promise<IAdminPage[]> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IAdminPage[]>>(API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ALL);
    return response.data.data;
  },

  /**
   * Get all available data tables for permission management
   */
  async getAvailableDataTables(): Promise<IDataTableSummary[]> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IDataTablesListResponse>>(API_CONFIG.ENDPOINTS.ADMIN_DATA_TABLES_LIST);
    return response.data.data.dataTables;
  },

  /**
   * Get all available groups for permission management
   */
  async getAvailableGroups(): Promise<IGroupDetails[]> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IGroupsListResponse>>(API_CONFIG.ENDPOINTS.ADMIN_GROUPS_GET_ALL);
    return response.data.data.groups;
  },

  // Audit Management Methods

  /**
   * Get data access audit logs with optional filtering
   */
  async getAuditLogs(params?: IAuditLogsListParams): Promise<IAuditLogsListResponse> {
    const queryParams = params ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])) : undefined;

    const response = await permissionAwareApiClient.get<IBaseApiResponse<IAuditLogsListResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_AUDIT_DATA_ACCESS_LIST,
      { params: queryParams }
    );
    return response.data.data;
  },

  /**
   * Get single audit log by ID
   */
  async getAuditLog(auditId: number): Promise<IAuditLogDetails> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IAuditLogDetails>>(API_CONFIG.ENDPOINTS.ADMIN_AUDIT_DATA_ACCESS_DETAIL, auditId);
    return response.data.data;
  },

  /**
   * Get audit statistics
   */
  async getAuditStats(params?: IAuditStatsParams): Promise<IAuditLogStatsResponse> {
    const queryParams = params ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])) : undefined;

    const response = await permissionAwareApiClient.get<IBaseApiResponse<IAuditLogStatsResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_AUDIT_DATA_ACCESS_STATS,
      { params: queryParams }
    );
    return response.data.data;
  }
};
