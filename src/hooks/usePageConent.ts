import { useQuery } from '@tanstack/react-query';
import { PageService } from '@/services/api.service';

export function usePageContent(keyword: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['page-content', keyword],
        queryFn: () => PageService.getPageContent(keyword),
        staleTime: 1000, // Cache for 1 minute
        enabled: !!keyword, // Only run query if keyword is provided
    });

    return {
        content: data,
        isLoading,
        error
    };
}