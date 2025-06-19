/**
 * Debug configuration for development and testing environments.
 * Controls debug features, logging, and development tools.
 * 
 * @module config/debug.config
 */

export interface IDebugConfig {
    enabled: boolean;
    logging: {
        enabled: boolean;
        level: 'debug' | 'info' | 'warn' | 'error';
        showTimestamp: boolean;
        showComponent: boolean;
    };
    components: {
        navigationDebug: boolean;
        performanceMonitor: boolean;
        stateInspector: boolean;
        apiLogger: boolean;
        dragDropDebug: boolean;
    };
    features: {
        showBoundingBoxes: boolean;
        highlightReRenders: boolean;
        showQueryDevtools: boolean;
    };
}

/**
 * Debug configuration based on environment variables and development mode
 */
export const DEBUG_CONFIG: IDebugConfig = {
    enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true',
    logging: {
        enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true',
        level: (process.env.NEXT_PUBLIC_DEBUG_LEVEL as any) || 'debug',
        showTimestamp: true,
        showComponent: true,
    },
    components: {
        navigationDebug: process.env.NEXT_PUBLIC_DEBUG_NAV === 'true' || process.env.NODE_ENV === 'development',
        performanceMonitor: process.env.NEXT_PUBLIC_DEBUG_PERF === 'true',
        stateInspector: process.env.NEXT_PUBLIC_DEBUG_STATE === 'true',
        apiLogger: process.env.NEXT_PUBLIC_DEBUG_API === 'true',
        dragDropDebug: process.env.NEXT_PUBLIC_DEBUG_DRAGDROP === 'true' || process.env.NODE_ENV === 'development',
    },
    features: {
        showBoundingBoxes: process.env.NEXT_PUBLIC_DEBUG_BOXES === 'true',
        highlightReRenders: process.env.NEXT_PUBLIC_DEBUG_RENDERS === 'true',
        showQueryDevtools: process.env.NODE_ENV === 'development',
    },
};

/**
 * Helper function to check if debug is enabled
 */
export const isDebugEnabled = (): boolean => DEBUG_CONFIG.enabled;

/**
 * Helper function to check if specific debug component is enabled
 */
export const isDebugComponentEnabled = (component: keyof IDebugConfig['components']): boolean => 
    DEBUG_CONFIG.enabled && DEBUG_CONFIG.components[component]; 