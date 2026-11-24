/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery } from '@tanstack/react-query';
import { AdminDataAccessApi } from '../api/admin';
import { REACT_QUERY_CONFIG, refetchOnMountWhenInvalidated } from '../config/react-query.config';

/**
 * Data-access resource types that enabled plugins add (e.g. surveys), for the
 * "Permissions for role" screen. They change only when a plugin is installed,
 * updated or removed, so they use the long lookup cache tier.
 */
export function usePluginResourceTypes(enabled = true) {
    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PLUGIN_RESOURCE_TYPES,
        queryFn: AdminDataAccessApi.getPluginResourceTypes,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.gcTime,
        // Plugin changes invalidate it while the roles screen is closed.
        refetchOnMount: refetchOnMountWhenInvalidated,
        enabled,
    });
}
