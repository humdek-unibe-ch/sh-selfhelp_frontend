/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery } from '@tanstack/react-query';
import { AdminDataAccessApi } from '../api/admin';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Data-access resource types that enabled plugins add (e.g. surveys), for the
 * "Permissions for role" screen. They change only when a plugin is installed,
 * updated or removed, so they use the long lookup cache tier.
 */
export function usePluginResourceTypes(enabled = true) {
    return useQuery({
        queryKey: ['admin-plugin-resource-types'],
        queryFn: AdminDataAccessApi.getPluginResourceTypes,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.gcTime,
        enabled,
    });
}
