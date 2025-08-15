import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { 
    IUnusedSectionsResponse, 
    IRefContainerSectionsResponse 
} from '../../types/responses/admin/section-utility.types';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

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

    /**
     * Delete a specific unused section
     */
    async deleteUnusedSection(sectionId: number): Promise<IBaseApiResponse<any>> {
        const response = await apiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UNUSED_DELETE(sectionId));
        return response.data;
    },

    /**
     * Delete all unused sections
     */
    async deleteAllUnusedSections(): Promise<IBaseApiResponse<any>> {
        const response = await apiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UNUSED_DELETE_ALL);
        return response.data;
    },

    /**
     * Force delete a section from a page (even if it has children or references)
     */
    async forceDeleteSection(pageKeyword: string, sectionId: number): Promise<IBaseApiResponse<any>> {
        const response = await apiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_FORCE_DELETE(pageKeyword, sectionId));
        return response.data;
    },
};
