import { IApiResponse } from '@/types/api/requests.type';
import { INavigationItem } from '@/types/api/navigation.type';
import { apiClient } from './api.service';
import { API_CONFIG } from '@/config/api.config';

export const NavigationService = {
    async getRoutes(): Promise<INavigationItem[]> {
        const response = await apiClient.get<IApiResponse<INavigationItem[]>>(API_CONFIG.ENDPOINTS.ALL_ROUTES);
        return response.data.data;
    }
};
