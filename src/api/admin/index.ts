/**
 * Centralized exports for all admin API modules.
 * This file provides a single import point for all admin API functionality.
 * 
 * @module api/admin
 */

export { AdminPageApi } from './page.api';
export { AdminPageKeywordsApi } from './page-keywords.api';
export { AdminSectionApi } from './section.api';
export { AdminStyleApi } from './style.api';
export { AdminLanguageApi } from './language.api';
export { AdminUserApi } from './user.api';
export { AdminAssetApi } from './asset.api';
export { AdminPermissionApi } from './permission.api';
export { AdminScheduledJobsApi } from './scheduled-jobs.api';

// Legacy compatibility - re-export as AdminApi for backward compatibility
import { AdminPageApi } from './page.api';
import { AdminPageKeywordsApi } from './page-keywords.api';
import { AdminSectionApi } from './section.api';
import { AdminStyleApi } from './style.api';
import { AdminLanguageApi } from './language.api';
import { AdminUserApi } from './user.api';
import { AdminAssetApi } from './asset.api';
import { AdminPermissionApi } from './permission.api';
import { AdminScheduledJobsApi } from './scheduled-jobs.api';
import { AdminActionApi } from './action.api';

export const AdminApi = {
    // Page methods
    ...AdminPageApi,

    // Page keywords methods
    ...AdminPageKeywordsApi,
    
    // Section methods
    ...AdminSectionApi,
    
    // Style methods
    ...AdminStyleApi,
    
    // Language methods
    ...AdminLanguageApi,
    
    // User methods
    ...AdminUserApi,
    
    
    // Asset methods
    ...AdminAssetApi,
    
    // Permission methods
    ...AdminPermissionApi,
    
    // Scheduled Jobs methods
    ...AdminScheduledJobsApi,

    // Actions methods
    ...AdminActionApi
}; 