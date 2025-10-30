/**
 * Custom hooks for audit logs management
 * Provides React Query hooks for fetching audit logs data
 */

import { useQuery } from '@tanstack/react-query';
import { AdminDataAccessApi } from '../api/admin/data-access.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type {
  IAuditLogsListResponse,
  IAuditLogsListParams,
  IAuditStatsParams
} from '../types/responses/admin/audit.types';

// Query keys
const AUDIT_QUERY_KEYS = {
  all: ['audit'] as const,
  lists: () => [...AUDIT_QUERY_KEYS.all, 'list'] as const,
  list: (params?: IAuditLogsListParams) => [...AUDIT_QUERY_KEYS.lists(), params] as const,
  details: () => [...AUDIT_QUERY_KEYS.all, 'details'] as const,
  detail: (id: number) => [...AUDIT_QUERY_KEYS.details(), id] as const,
  stats: () => [...AUDIT_QUERY_KEYS.all, 'stats'] as const,
  stat: (params?: IAuditStatsParams) => [...AUDIT_QUERY_KEYS.stats(), params] as const,
};

/**
 * Hook to fetch audit logs list with optional filtering and pagination
 */
export function useAuditLogs(params?: IAuditLogsListParams) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.list(params),
    queryFn: () => AdminDataAccessApi.getAuditLogs(params),
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
    select: (data: IAuditLogsListResponse) => ({
      ...data,
      // Transform data once for performance
      logs: data.data,
      pagination: {
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
      },
    }),
  });
}

/**
 * Hook to fetch single audit log details
 */
export function useAuditLog(auditId: number) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.detail(auditId),
    queryFn: () => AdminDataAccessApi.getAuditLog(auditId),
    enabled: !!auditId,
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
  });
}

/**
 * Hook to fetch audit statistics
 */
export function useAuditStats(params?: IAuditStatsParams) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.stat(params),
    queryFn: () => AdminDataAccessApi.getAuditStats(params),
    staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
    gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
  });
}
