import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { NavigationResponse, RouteItem } from '../types/navigation.types';
import { store } from '@/store/store';
import { fetchRoutes } from '@/store/routes/RouteSlice';

const apiClient = axios.create({
   baseURL: API_CONFIG.BASE_URL,
   headers: {
      'Content-Type': 'application/json',
   },
   withCredentials: true
});

export const NavigationService = {
   getRoutes: async (): Promise<void> => {
      try {
         const response = await apiClient.get<NavigationResponse>(API_CONFIG.ENDPOINTS.NAVIGATION);

         const routes = response.data.data
            .filter(item => !item.is_headless)
            .map(item => ({
               title: item.keyword,
               path: item.url,
               isNav: item.nav_position !== null,
               position: item.nav_position
            }))
            .sort((a, b) => {
               if (a.position === null) return 1;
               if (b.position === null) return -1;
               return a.position - b.position;
            });

         // Dispatch routes directly to Redux store
         await store.dispatch(fetchRoutes(routes));
      } catch (error) {
         console.error('Failed to fetch routes:', error);
         throw error;
      }
   },

   // Initialize routes on app start
   initializeRoutes: async (): Promise<void> => {
      try {
         await NavigationService.getRoutes();
      } catch (error) {
         console.error('Failed to initialize routes:', error);
      }
   }
};