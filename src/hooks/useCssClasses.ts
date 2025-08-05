import { useQuery } from '@tanstack/react-query';
import { FrontendApi } from '../api/frontend.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { ICssClassOption } from '../types/requests/admin/fields.types';

export function useCssClasses() {
    return useQuery({
        queryKey: ['css-classes'],
        queryFn: async () => {
            const response = await FrontendApi.getCssClasses();
            return response.data.classes as ICssClassOption[];
        },
        staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
        gcTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.gcTime,
        // staleTime: 1,
        // gcTime:1
    });
} 