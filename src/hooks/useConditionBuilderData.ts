/**
 * React Query hooks for condition builder data.
 * Provides data needed for the condition builder modal.
 * 
 * @module hooks/useConditionBuilderData
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AdminGroupApi } from '../api/admin/group.api';
import { permissionAwareApiClient } from '../api/base.api';
import { API_CONFIG } from '../config/api.config';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLookupsByType } from './useLookups';
import type { ILanguage } from '../types/responses/admin/languages.types';
import { IAdminPage } from '../types/responses/admin/admin.types';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { usePublicLanguages } from './useLanguages';

/**
 * Hook to get all groups for condition builder (requests large page size to get all)
 */
export function useConditionBuilderGroups() {
    return useQuery({
        queryKey: ['condition-builder', 'groups'],
        queryFn: async () => {
            const response = await AdminGroupApi.getGroups({ 
                page: 1, 
                pageSize: 1000 // Large page size to get all groups
            });
            
            // Convert to key-value format expected by React Query Builder
            const groupsMap: Record<string, string> = {};
            response.groups.forEach(group => {
                groupsMap[group.id.toString()] = group.name;
            });
            
            return groupsMap;
        },
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.gcTime,
    });
}


/**
 * Hook to get platform options from lookups
 */
export function useConditionBuilderPlatforms() {
    const platformLookups = useLookupsByType('pageAccessTypes');
    
    return useQuery({
        queryKey: ['condition-builder', 'platforms'],
        queryFn: () => {
            const platformsMap: Record<string, string> = {};
            platformLookups.forEach(lookup => {
                // Skip the combination option if it exists
                if (lookup.lookupCode !== 'mobile_and_web') {
                    platformsMap[lookup.lookupCode] = lookup.lookupValue;
                }
            });
            return platformsMap;
        },
        enabled: platformLookups.length > 0,
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
    });
}

/**
 * Hook to get all pages for condition builder
 */
export function useConditionBuilderPages() {
    return useQuery({
        queryKey: ['condition-builder', 'pages'],
        queryFn: async () => {
            const response = await permissionAwareApiClient.get<IBaseApiResponse<IAdminPage[]>>(API_CONFIG.ENDPOINTS.PAGES_GET_ALL);
            const pages = response.data.data || [];
            
            // Convert to key-value format expected by React Query Builder
            const pagesMap: Record<string, string> = {};
            pages.forEach((page: any) => {
                pagesMap[page.keyword] = page.title || page.keyword;
            });
            
            return pagesMap;
        },
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.gcTime,
    });
}

/**
 * Combined hook that provides all condition builder data
 */
export function useConditionBuilderData() {
    const groupsQuery = useConditionBuilderGroups();
    const languagesQuery = usePublicLanguages();
    const platformsQuery = useConditionBuilderPlatforms();
    const pagesQuery = useConditionBuilderPages();

    // Process languages data for condition builder format
    const processedLanguages = useMemo(() => {
        const languages = languagesQuery.languages || [];
        // Convert to key-value format expected by React Query Builder
        const languagesMap: Record<string, string> = {};
        languages.forEach((language: ILanguage) => {
            // Skip the "all languages" option if it exists
            if (language.id !== 1 || language.locale !== 'all') {
                languagesMap[language.id.toString()] = `${language.language} (${language.locale})`;
            }
        });
        return languagesMap;
    }, [languagesQuery.languages]);

    return {
        groups: groupsQuery.data || {},
        languages: processedLanguages,
        platforms: platformsQuery.data || {},
        pages: pagesQuery.data || {},
        isLoading: groupsQuery.isLoading || languagesQuery.isLoading || platformsQuery.isLoading || pagesQuery.isLoading,
        isError: groupsQuery.isError || languagesQuery.error || platformsQuery.isError || pagesQuery.isError,
        error: groupsQuery.error || languagesQuery.error || platformsQuery.error || pagesQuery.error,
    };
}