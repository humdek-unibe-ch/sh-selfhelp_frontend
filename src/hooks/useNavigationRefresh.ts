/**
 * Custom hook for managing navigation refresh triggers.
 * Provides functionality to refresh navigation data when user permissions or access might have changed.
 * This ensures users see updated navigation after form submissions or other backend actions.
 * 
 * @module hooks/useNavigationRefresh
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useLanguageContext } from '../app/contexts/LanguageContext';

/**
 * Hook for refreshing navigation data when user access might have changed.
 * This is crucial for ensuring users see updated navigation after:
 * - Form submissions that might grant access to new pages
 * - User actions that modify permissions
 * - Page refreshes where permissions might have been updated server-side
 * 
 * @returns {Object} Object containing navigation refresh functions
 */
export function useNavigationRefresh() {
    const queryClient = useQueryClient();
    const { currentLanguageId } = useLanguageContext();
    
    /**
     * Refreshes navigation data by invalidating and refetching the frontend pages.
     * Uses staleTime: 0 to force fresh data from the server.
     */
    const refreshNavigation = useCallback(async () => {
        const queryKey = REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES(currentLanguageId);
        
        // Invalidate the query to mark it as stale
        await queryClient.invalidateQueries({ queryKey });
        
        // Force refetch with fresh data
        await queryClient.refetchQueries({ 
            queryKey,
            type: 'active' // Only refetch if the query is currently active
        });
    }, [queryClient, currentLanguageId]);
    
    /**
     * Refreshes navigation silently in the background without affecting UI loading states.
     * This is useful for periodic refreshes or when the user might not notice the update.
     */
    const refreshNavigationSilently = useCallback(async () => {
        const queryKey = REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES(currentLanguageId);
        
        // Prefetch fresh data in the background
        await queryClient.prefetchQuery({
            queryKey,
            queryFn: async () => {
                const { NavigationApi } = await import('../api/navigation.api');
                return NavigationApi.getPagesWithLanguage(currentLanguageId);
            },
            staleTime: 0, // Force fresh data
        });
    }, [queryClient, currentLanguageId]);
    
    /**
     * Triggers navigation refresh on page navigation.
     * This ensures that when users navigate to a new page, they see the most up-to-date navigation.
     */
    const refreshOnPageChange = useCallback(async () => {
        // Use silent refresh to avoid loading indicators during navigation
        await refreshNavigationSilently();
    }, [refreshNavigationSilently]);
    
    /**
     * Triggers navigation refresh after form submissions or user actions.
     * This ensures that any new pages or permissions granted are immediately visible.
     */
    const refreshAfterUserAction = useCallback(async () => {
        // Use full refresh to ensure UI reflects changes
        await refreshNavigation();
    }, [refreshNavigation]);
    
    return {
        refreshNavigation,
        refreshNavigationSilently,
        refreshOnPageChange,
        refreshAfterUserAction,
    };
}
