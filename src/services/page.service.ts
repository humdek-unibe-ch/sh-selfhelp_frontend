// src/services/page.service.ts
import { IApiResponse, IPageContent } from '@/types/api/requests.type';
import { apiClient } from './api.service';
import { API_CONFIG } from '@/config/api.config';

let currentKeyword = '';

export const PageService = {
    setKeyword(keyword: string) {
        currentKeyword = keyword;
    },

    getKeyword(): string {
        return currentKeyword;
    },

    async getPageContent(keyword: string): Promise<IPageContent> {
        const response = await apiClient.get<IApiResponse<IPageContent>>(API_CONFIG.ENDPOINTS.PAGE(keyword));
        return response.data.data;
    },

    async updatePageContent(keyword: string, content: any): Promise<IApiResponse<any>> {
        try {
            const response = await apiClient.put<IApiResponse<any>>(API_CONFIG.ENDPOINTS.PAGE(keyword), content);
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }
            throw error;
        }
    }
};