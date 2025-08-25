/**
 * React Query Global Configuration
 * 
 * Global settings for React Query caching and data fetching.
 * All queries will use these defaults unless specifically overridden.
 */

export const REACT_QUERY_CONFIG = {
    /**
     * Global cache configuration
     * Optimized cache times for smooth navigation and better performance
     */
    CACHE: {
        staleTime: 1000, // 1 second - how long data is considered fresh
        gcTime: 1000, // 1 second - how long unused data stays in cache (formerly cacheTime)
    },
    
    /**
     * Query defaults that will be applied to all queries
     */
    DEFAULT_OPTIONS: {
        queries: {
            staleTime: 1000, // 1 second
            gcTime: 1000, // 1 second
            retry: 3, // Number of retry attempts
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnMount: false, // Don't refetch when component mounts - use cache first
            refetchOnReconnect: true, // Refetch when network reconnects
        },
        mutations: {
            retry: 1, // Only retry mutations once
            retryDelay: 1000, // 1 second delay for mutation retries
        },
    },
    
    /**
     * Specific query keys and their configurations
     * Use these for queries that need different cache times
     */
    QUERY_KEYS: {
        // Frontend pages with language support
        FRONTEND_PAGES: (languageId: number) => ['frontend-pages', languageId],
        
        // Admin pages
        ADMIN_PAGES: ['admin-pages'],
        
        // Languages
        LANGUAGES: ['languages'],
        PUBLIC_LANGUAGES: ['public-languages'],
        
        // Page content
        PAGE_CONTENT: (keyword: string, languageId?: number) => 
            languageId ? ['page-content', keyword, languageId] : ['page-content', keyword],
        
        // Page details
        PAGE_DETAILS: (keyword: string) => ['page-details', keyword],
        
        // Section details
        SECTION_DETAILS: (keyword: string, sectionId: number) => ['section-details', keyword, sectionId],
        
        // Lookups
        LOOKUPS: ['lookups'],
        
        // Style groups
        STYLE_GROUPS: ['style-groups'],
    },
    
    /**
     * Special configurations for specific query types
     * Override these when needed for specific queries
     */
    SPECIAL_CONFIGS: {
        // For static data that rarely changes (like lookups, style groups)
        STATIC_DATA: {
            staleTime: 1000, // 1 second for static data
            gcTime: 1000, // 1 second in cache
        },
        
        // For real-time data that changes frequently
        REAL_TIME: {
            staleTime: 0, // Always stale, always refetch
            gcTime: 30 * 1000, // 30 seconds in cache for quick navigation
        },
        
        // For user-specific data
        USER_DATA: {
            staleTime: 1000, // 1 second
            gcTime: 1000, // 1 second
        },
    },
} as const; 