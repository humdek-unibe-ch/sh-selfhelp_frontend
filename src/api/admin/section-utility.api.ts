import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { 
    IUnusedSectionsResponse, 
    IRefContainerSectionsResponse 
} from '../../types/responses/admin/section-utility.types';

/**
 * Admin Section Utility API Service
 * Handles section utility operations like getting unused sections and ref containers
 */
export const AdminSectionUtilityApi = {
    /**
     * Get unused sections (not in hierarchy and not assigned to pages)
     */
    async getUnusedSections(): Promise<IUnusedSectionsResponse> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UNUSED_GET);
        return response.data;
    },

    /**
     * Get sections with refContainer style
     */
    async getRefContainers(): Promise<IRefContainerSectionsResponse> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_REF_CONTAINERS_GET);
        return response.data;
    },
};
