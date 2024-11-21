import { useQuery } from '@tanstack/react-query';
import { PageService } from '@/services/api.service';

export function usePageContent(keyword: string, enabled: boolean = true) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['page-content', keyword],
        queryFn: () => PageService.getPageContent(keyword),
        staleTime: 1000, // Cache for 1 minute
        enabled: !!keyword && enabled, // Only run query if keyword is provided and enabled is true
    });

    return {
        content: data,
        isLoading,
        error
    };
}