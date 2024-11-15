import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { NavigationResponse, Route } from '../types/navigation/navigation.types';

const apiClient = axios.create({
   baseURL: API_CONFIG.BASE_URL,
   headers: {
      'Content-Type': 'application/json',
   },
   withCredentials: true
});

export const NavigationService = {
   getRoutes: async (): Promise<Route[]> => {
      const response = await apiClient.get<NavigationResponse>(API_CONFIG.ENDPOINTS.NAVIGATION);
      return response.data.data.map(item => ({
         title: item.keyword,
         path: item.url,
         isNav: item.nav_position !== null,
         position: item.nav_position
      }));
   }
};