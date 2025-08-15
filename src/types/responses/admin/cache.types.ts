/**
 * Cache Management Response Types
 * Based on the backend API schemas for cache operations
 */

export interface ICacheClearedResponse {
    cleared: boolean;
    category?: string;
    user_id?: number;
    timestamp: string;
}

export interface ICacheHealthRecommendation {
    type: 'performance' | 'category' | 'invalidation' | 'memory';
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
}

export interface ICacheHealthResponse {
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
    hit_rate: number;
    total_operations: number;
    recommendations: ICacheHealthRecommendation[];
    timestamp: string;
}

export interface ICacheGlobalStats {
    hits: number;
    misses: number;
    sets: number;
    invalidations: number;
    hit_rate: number;
    total_operations: number;
    last_updated: string | null;
}

export interface ICacheCategoryStats {
    hits: number;
    misses: number;
    sets: number;
    invalidations: number;
    hit_rate: number;
    total_operations: number;
    cache_pool: string;
    last_activity: string;
    invalidation_breakdown: any[];
}

export interface ICachePool {
    name: string;
    description: string;
    default_ttl: number;
}

export interface ICacheStatsResponse {
    cache_stats: {
        global_stats: ICacheGlobalStats;
        category_stats: Record<string, ICacheCategoryStats>;
    };
    cache_categories: string[];
    cache_pools: Record<string, ICachePool>;
    top_performing_categories: Record<string, ICacheCategoryStats>;
    timestamp: string;
}

// Type for cache category options
export type TCacheCategory = 'pages' | 'users' | 'sections' | 'languages' | 'groups' | 'roles' | 'permissions' | 'lookups' | 'assets' | 'frontend_user' | 'cms_preferences' | 'scheduled_jobs' | 'actions';

// Type for cache health status
export type TCacheHealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

// Type for cache health colors
export type TCacheHealthColor = 'green' | 'blue' | 'yellow' | 'red' | 'gray';
