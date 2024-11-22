import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { IApiResponse, IPageContent } from '@/types/api/requests.type';
import { INavigationItem } from '@/types/api/navigation.type';
import { ILoginRequest, ILoginResponse } from '@/types/api/auth.type';

const apiClient = axios.create({
   baseURL: API_CONFIG.BASE_URL,
   headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
   }
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

export const AuthService = {
    login: async (credentials: ILoginRequest): Promise<ILoginResponse> => {
        const formData = new URLSearchParams();
        formData.append('user', credentials.user);
        formData.append('password', credentials.password);
        
        const response = await apiClient.post<IApiResponse<ILoginResponse>>(
            API_CONFIG.ENDPOINTS.LOGIN,
            formData.toString()
        );
        return response.data.data;
    }
};
