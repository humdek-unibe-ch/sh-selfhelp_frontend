/**
 * Centralized exports for all admin API modules.
 * This file provides a single import point for all admin API functionality.
 * 
 * @module api/admin
 */

export { AdminPageApi } from './page.api';
export { AdminSectionApi } from './section.api';
export { AdminStyleApi } from './style.api';
export { AdminLanguageApi } from './language.api';

// Legacy compatibility - re-export as AdminApi for backward compatibility
import { AdminPageApi } from './page.api';
import { AdminSectionApi } from './section.api';
import { AdminStyleApi } from './style.api';
import { AdminLanguageApi } from './language.api';

export const AdminApi = {
    // Page methods
    ...AdminPageApi,
    
    // Section methods
    ...AdminSectionApi,
    
    // Style methods
    ...AdminStyleApi,
    
    // Language methods
    ...AdminLanguageApi
}; 