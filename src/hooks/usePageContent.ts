import { useQuery } from '@tanstack/react-query';
import { PageService } from '@/services/page.service';
import { useContext, useEffect } from 'react';
import { PageContentContext } from '@/contexts/PageContentContext';

export function usePageContent(keyword: string, enabled: boolean = true) {
    const context = useContext(PageContentContext);
    if (!context) {
        throw new Error('usePageContent must be used within a PageContentProvider');
    }
    const { setPageContent } = context;

    const { data, isLoading, error } = useQuery({
        queryKey: ['page-content', keyword],
        queryFn: () => PageService.getPageContent(keyword),
        staleTime: 1000, // Cache for 1 second
        enabled: !!keyword && enabled, // Only run query if keyword is provided and enabled is true
    });

    // Sync React Query data with context
    useEffect(() => {
        if (data) {
            setPageContent(data);
        }
    }, [data, setPageContent]);

    return {
        content: data,
        isLoading,
        error
    };
}