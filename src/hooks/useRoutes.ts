import { useQuery } from '@tanstack/react-query';
import { NavigationService } from '../services/api.service';

export const useRoutes = () => {
  return useQuery({
    queryKey: ['routes'],
    queryFn: NavigationService.getRoutes,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  }); 
};