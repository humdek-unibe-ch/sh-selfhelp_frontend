import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { IApiResponse, IPageContent } from '@/types/api/requests.type';
import { INavigationItem } from '@/types/api/navigation.type';

const apiClient = axios.create({
   baseURL: API_CONFIG.BASE_URL,
   headers: {
      'Content-Type': 'application/json',
   },
   withCredentials: true
});

export const NavigationService = {
    getRoutes: async (): Promise<INavigationItem[]> => {
       const response = await apiClient.get<IApiResponse<INavigationItem[]>>(API_CONFIG.ENDPOINTS.ALL_ROUTES);
       return response.data.data;
    }
 };

 export const PageService = {
    getPageContent: async (keyword: string): Promise<IPageContent> => {
        const response = await apiClient.get<IApiResponse<IPageContent>>(API_CONFIG.ENDPOINTS.PAGE_CONTENT(keyword));
        return response.data.data;
    }
};
