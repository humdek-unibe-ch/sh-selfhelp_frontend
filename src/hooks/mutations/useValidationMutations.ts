import { useMutation, useQuery } from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

/**
 * Hook to validate a user token before showing the validation form
 */
export function useValidateTokenMutation() {
    return useMutation({
        mutationFn: async ({ userId, token }: { userId: number; token: string }) => {
            return await AuthApi.validateToken(userId, token);
        },
        ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.mutations
    });
}

/**
 * Hook to complete user validation with password and additional data
 */
export function useCompleteValidationMutation() {
    return useMutation({
        mutationFn: async ({
            userId,
            token,
            data
        }: {
            userId: number;
            token: string;
        data: {
            password: string;
            name?: string;
            section_id: number;
            form_inputs?: Record<string, any>;
        };
        }) => {
            return await AuthApi.completeValidation(userId, token, data);
        },
        ...REACT_QUERY_CONFIG.DEFAULT_OPTIONS.mutations
    });
}

/**
 * Hook to check token validity (query, not mutation)
 */
export function useTokenValidation(userId: number, token: string) {
    return useQuery({
        queryKey: ['validation', 'token', userId, token],
        queryFn: () => AuthApi.validateToken(userId, token),
        enabled: !!userId && !!token,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        retry: false // Don't retry token validation failures
    });
}
