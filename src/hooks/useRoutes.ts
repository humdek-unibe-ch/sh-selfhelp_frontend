import { useQuery } from '@tanstack/react-query';
import { NavigationService } from '@/services/api.service';
import { Route } from '@/types/navigation/navigation.types';

export function useRoutes() {
  return useQuery<Route[], Error>({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await NavigationService.getRoutes();
      if (!response) throw new Error('No routes received');
      return response;
    }
  });
}