/**
 * Custom hook for handling authentication-related UI operations.
 * This hook provides a thin wrapper around AuthService with loading and error states.
 * 
 * @module hooks/useAuth
 */

import { useQuery } from '@tanstack/react-query';
import { IAuthState } from '@/types/api/auth.type';

export function useAuth() {
    return useQuery({
        queryKey: ['auth'],
        queryFn: async (): Promise<IAuthState> => {
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');
            const expiresIn = localStorage.getItem('expires_in');

            return {
                isAuthenticated: Boolean(accessToken),
                accessToken,
                refreshToken,
                expiresIn: expiresIn ? parseInt(expiresIn) : null
            };
        },
        staleTime: Infinity,
    });
}
