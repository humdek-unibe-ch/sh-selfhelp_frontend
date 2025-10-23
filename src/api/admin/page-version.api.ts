/**
 * Page Version API Client
 * Handles all page versioning and publishing operations
 */

import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import {
    IPublishVersionRequest,
    IVersionListParams,
    IVersionDetailsParams,
    IVersionCompareParams
} from '../../types/requests/admin/page-version.types';
import {
    IPageVersion,
    IVersionHistoryResponse,
    IVersionComparisonResponse,
    IPublishResponse,
    IUnpublishedChangesResponse
} from '../../types/responses/admin/page-version.types';

export const PageVersionApi = {
    /**
     * Publish a new version from current page state
     */
    async publishNewVersion(pageId: number, data?: IPublishVersionRequest): Promise<IPublishResponse> {
        const response = await apiClient.post<IBaseApiResponse<IPublishResponse>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_PUBLISH(pageId),
            data || {}
        );
        return response.data.data;
    },

    /**
     * Publish a specific existing version
     */
    async publishSpecificVersion(pageId: number, versionId: number): Promise<IPublishResponse> {
        const response = await apiClient.post<IBaseApiResponse<IPublishResponse>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_PUBLISH_SPECIFIC(pageId, versionId),
            {}
        );
        return response.data.data;
    },

    /**
     * Unpublish current version (revert to draft mode)
     */
    async unpublishPage(pageId: number): Promise<{ message: string }> {
        const response = await apiClient.post<IBaseApiResponse<{ message: string }>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_UNPUBLISH(pageId),
            {}
        );
        return response.data.data;
    },

    /**
     * List all versions for a page
     */
    async listVersions(pageId: number, params?: IVersionListParams): Promise<IVersionHistoryResponse> {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());

        const url = `${API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_LIST(pageId)}${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`;

        const response = await apiClient.get<IBaseApiResponse<IVersionHistoryResponse>>(url);
        return response.data.data;
    },

    /**
     * Get specific version details
     */
    async getVersion(pageId: number, versionId: number, params?: IVersionDetailsParams): Promise<IPageVersion> {
        const queryParams = new URLSearchParams();
        if (params?.include_page_json) queryParams.append('include_page_json', 'true');

        const url = `${API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_GET_ONE(pageId, versionId)}${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`;

        const response = await apiClient.get<IBaseApiResponse<IPageVersion>>(url);
        return response.data.data;
    },

    /**
     * Compare current draft with a specific version
     */
    async compareDraftWithVersion(
        pageId: number,
        versionId: number,
        format: 'unified' | 'side_by_side' | 'json_patch' | 'summary' = 'side_by_side'
    ): Promise<IVersionComparisonResponse> {
        const response = await apiClient.get<IBaseApiResponse<IVersionComparisonResponse>>(
            `${API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_COMPARE_DRAFT(pageId, versionId)}?format=${format}`
        );
        return response.data.data;
    },

    /**
     * Check if page has unpublished changes (fast hash-based check)
     */
    async hasUnpublishedChanges(pageId: number): Promise<IUnpublishedChangesResponse> {
        const response = await apiClient.get<IBaseApiResponse<IUnpublishedChangesResponse>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_HAS_CHANGES(pageId)
        );
        return response.data.data;
    },

    /**
     * Compare two versions
     */
    async compareVersions(
        pageId: number,
        version1Id: number,
        version2Id: number,
        params?: IVersionCompareParams
    ): Promise<IVersionComparisonResponse> {
        const queryParams = new URLSearchParams();
        if (params?.format) queryParams.append('format', params.format);

        const url = `${API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_COMPARE(pageId, version1Id, version2Id)}${
            queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`;

        const response = await apiClient.get<IBaseApiResponse<IVersionComparisonResponse>>(url);
        return response.data.data;
    },

    /**
     * Delete a version
     */
    async deleteVersion(pageId: number, versionId: number): Promise<{ message: string }> {
        const response = await apiClient.delete<IBaseApiResponse<{ message: string }>>(
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_DELETE(pageId, versionId)
        );
        return response.data.data;
    }
};

