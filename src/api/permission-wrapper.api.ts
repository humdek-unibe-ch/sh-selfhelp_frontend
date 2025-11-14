/**
 * Permission-aware API client wrapper
 * Automatically checks user permissions before executing API calls
 * based on the permission configuration in API_CONFIG.ENDPOINTS
 * 
 * @module api/permission-wrapper.api
 */

import { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api.config';
import { warn, error as logError } from '../utils/debug-logger';

/**
 * Permission denied error class
 */
export class PermissionDeniedError extends Error {
    constructor(
        public requiredPermissions: string[],
        public userPermissions: string[],
        public endpoint: string
    ) {
        super(
            `Permission denied. Required: [${requiredPermissions.join(', ')}]. ` +
            `User has: [${userPermissions.join(', ')}]`
        );
        this.name = 'PermissionDeniedError';
    }
}

/**
 * Singleton class to manage user permissions
 * Updated from user-data endpoint
 */
class PermissionManager {
    private static instance: PermissionManager;
    private userPermissions: string[] = [];
    private isInitialized = false;

    private constructor() {}

    static getInstance(): PermissionManager {
        if (!PermissionManager.instance) {
            PermissionManager.instance = new PermissionManager();
        }
        return PermissionManager.instance;
    }

    /**
     * Set user permissions (called when user data is fetched)
     */
    setPermissions(permissions: string[]): void {
        this.userPermissions = permissions || [];
        this.isInitialized = true;
    }

    /**
     * Clear permissions (on logout)
     */
    clearPermissions(): void {
        this.userPermissions = [];
        this.isInitialized = false;
    }

    /**
     * Get current user permissions
     */
    getPermissions(): string[] {
        return this.userPermissions;
    }

    /**
     * Check if user is initialized
     */
    isUserInitialized(): boolean {
        return this.isInitialized;
    }

    /**
     * Check if user has required permissions
     */
    hasPermissions(requiredPermissions: string[]): boolean {
        // If no permissions required, allow access
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        // User must have ALL required permissions
        return requiredPermissions.every(permission =>
            this.userPermissions.includes(permission)
        );
    }

    /**
     * Check if user has any of the required permissions
     */
    hasAnyPermission(requiredPermissions: string[]): boolean {
        // If no permissions required, allow access
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        // User must have at least ONE required permission
        return requiredPermissions.some(permission =>
            this.userPermissions.includes(permission)
        );
    }
}

// Export the singleton instance
export const permissionManager = PermissionManager.getInstance();


/**
 * Check permissions before making API call
 * Permission metadata MUST be attached - no fallback logic
 */
function checkPermissions(config: InternalAxiosRequestConfig): void {
    const url = config.url || '';
    const fullUrl = url.startsWith('http') ? url : `${config.baseURL || ''}${url}`;

    // Check if permission metadata was attached by permissionAwareApiClient

    const metadata = (config as any)._permissionMetadata;
    
    if (!metadata) {
        // NO FALLBACK - Permission metadata is REQUIRED
        const error = new Error(
            `Permission metadata missing for API call: ${fullUrl}\n` +
            `You must use permissionAwareApiClient instead of permissionAwareApiClient.\n` +
            `Example: permissionAwareApiClient.get({ route: endpoint.route, permissions: endpoint.permissions })`
        );
        logError('Permission metadata missing', 'PermissionWrapper', {
            url: fullUrl,
            message: 'Use permissionAwareApiClient instead of apiClient'
        });
        throw error;
    }

    // Permission metadata is attached - use it directly
    if (!metadata.permissions || metadata.permissions.length === 0) {
        // Public endpoint - no permission check needed
        return;
    }

    // If user is not initialized yet, allow the request
    // (permissions will be checked by backend anyway)
    if (!permissionManager.isUserInitialized()) {
        warn('User permissions not initialized yet, allowing request', 'PermissionWrapper');
        return;
    }

    // Check permissions from metadata
    if (!permissionManager.hasPermissions(metadata.permissions)) {
        const error = new PermissionDeniedError(
            metadata.permissions,
            permissionManager.getPermissions(),
            fullUrl
        );
        
        logError('Permission check failed', 'PermissionWrapper', {
            url: fullUrl,
            required: metadata.permissions,
            userHas: permissionManager.getPermissions()
        });
        
        throw error;
    }
}

/**
 * Initialize permission checking interceptor
 * This should be called after apiClient is fully initialized
 * @param client The Axios instance to add permission checking to
 */
export function initializePermissionChecking(client: AxiosInstance): void {
    // Add request interceptor for permission checking
    // This runs AFTER the base.api.ts interceptors
    client.interceptors.request.use(
        (config) => {
            try {
                checkPermissions(config);
            } catch (error) {
                // If permission check fails, reject the request immediately
                return Promise.reject(error);
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
}

/**
 * Helper function to manually check if user has permission for an endpoint
 * Useful for UI elements (disabling buttons, hiding options, etc.)
 */
export function canAccessEndpoint(endpointKey: keyof typeof API_CONFIG.ENDPOINTS): boolean {
    const config = API_CONFIG.ENDPOINTS[endpointKey];
    
    if (!config || typeof config !== 'object' || !('permissions' in config)) {
        return true; // If no config, assume accessible
    }

    return permissionManager.hasPermissions(config.permissions || []);
}

/**
 * Helper function to get required permissions for an endpoint
 */
export function getEndpointPermissions(endpointKey: keyof typeof API_CONFIG.ENDPOINTS): string[] {
    const config = API_CONFIG.ENDPOINTS[endpointKey];
    
    if (!config || typeof config !== 'object' || !('permissions' in config)) {
        return [];
    }

    return config.permissions || [];
}

