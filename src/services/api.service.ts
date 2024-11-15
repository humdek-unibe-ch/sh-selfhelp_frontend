import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { NavigationItem, NavigationResponse, Route } from '../types/navigation/navigation.types';

const apiClient = axios.create({
   baseURL: API_CONFIG.BASE_URL,
   headers: {
      'Content-Type': 'application/json',
   },
   withCredentials: true
});

export const NavigationService = {
   getRoutes: async (): Promise<NavigationItem[]> => {
      const response = await apiClient.get<NavigationResponse>(API_CONFIG.ENDPOINTS.NAVIGATION);
      return response.data.data;
   }
};