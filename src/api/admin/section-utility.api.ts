import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type {
    IUnusedSectionsData,
    IRefContainerSectionsData
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
    async getUnusedSections(): Promise<IUnusedSectionsData> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IUnusedSectionsData>>(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UNUSED_GET);
        return response.data.data;
    },

    /**
     * Get sections with refContainer style
     */
    async getRefContainers(): Promise<IRefContainerSectionsData> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IRefContainerSectionsData>>(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_GET_REF_CONTAINERS);
        return response.data.data;
    },

    /**
     * Delete a specific unused section
     */
    async deleteUnusedSection(sectionId: number): Promise<IBaseApiResponse<any>> {
        const response = await permissionAwareApiClient.delete<IBaseApiResponse<any>>(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UNUSED_DELETE, sectionId);
        return response.data;
    },

    /**
     * Delete all unused sections
     */
    async deleteAllUnusedSections(): Promise<IBaseApiResponse<any>> {
        const response = await permissionAwareApiClient.delete<IBaseApiResponse<any>>(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_UNUSED_DELETE_ALL);
        return response.data;
    },

    /**
     * Force delete a section from a page (even if it has children or references)
     */
    async forceDeleteSection(pageId: number, sectionId: number): Promise<IBaseApiResponse<any>> {
        const response = await permissionAwareApiClient.delete<IBaseApiResponse<any>>(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_FORCE_DELETE, pageId, sectionId);
        return response.data;
    },
};
