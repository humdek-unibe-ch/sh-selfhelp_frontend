import { useQuery } from '@tanstack/react-query';
import { AdminPermissionApi } from '../api/admin/permission.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { IPermissionsListResponse } from '../api/admin/permission.api';

// Query keys
const PERMISSIONS_QUERY_KEYS = {
  all: ['permissions'] as const,
  lists: () => [...PERMISSIONS_QUERY_KEYS.all, 'list'] as const,
};

// Get all permissions
export function usePermissions() {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.lists(),
    queryFn: () => AdminPermissionApi.getAllPermissions(),
    staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
  });
} 