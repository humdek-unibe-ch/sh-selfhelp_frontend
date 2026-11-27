/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery } from '@tanstack/react-query';
import { AdminPermissionApi } from '../api/admin/permission.api';
import { REACT_QUERY_CONFIG, refetchOnMountWhenInvalidated } from '../config/react-query.config';

// Query keys. The root is the registry's `PERMISSIONS_ALL`: the ACL watcher
// marks it stale when the signed-in person or their roles change.
const PERMISSIONS_QUERY_KEYS = {
  all: REACT_QUERY_CONFIG.QUERY_KEYS.PERMISSIONS_ALL,
  lists: () => [...PERMISSIONS_QUERY_KEYS.all, 'list'] as const,
};

// Get all permissions. Each item says whether the signed-in person may hand it
// out (`can_assign`), so a copy made for another person must be read again.
export function usePermissions() {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.lists(),
    queryFn: () => AdminPermissionApi.getAllPermissions(),
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.STATIC.staleTime,
    refetchOnMount: refetchOnMountWhenInvalidated,
  });
} 