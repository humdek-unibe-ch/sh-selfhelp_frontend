/**
 * Cache Management Request Types
 * Based on the backend API schemas for cache operations
 */

export interface IClearCacheCategoryRequest {
    category: 'pages' | 'users' | 'sections' | 'languages' | 'groups' | 'roles' | 'permissions' | 'lookups' | 'assets' | 'frontend_user' | 'cms_preferences' | 'scheduled_jobs';
}

export interface IClearUserCacheRequest {
    user_id: number;
}
