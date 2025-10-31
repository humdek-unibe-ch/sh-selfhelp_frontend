import { permissionAwareApiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import type { 
    ICssClassesResponse
} from '../types/requests/admin/fields.types';

export const FrontendApi = {
    /**
     * Get CSS classes for select fields
     */
    async getCssClasses(): Promise<ICssClassesResponse> {
        const response = await permissionAwareApiClient.get(API_CONFIG.ENDPOINTS.FRONTEND_CSS_CLASSES_GET_ALL);
        return response.data;
    },


}; 