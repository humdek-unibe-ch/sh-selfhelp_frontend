/**
 * Custom hook for handling authentication-related operations in the application.
 * This hook provides functionality for user login, logout, and token refresh operations,
 * while managing loading and error states.
 * 
 * @module hooks/useAuth
 */

import { useState } from 'react';
import { ILoginRequest } from '@/types/api/auth.type';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthService } from '@/services/auth.service';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { updateAuthState } = useAuthContext();

    /**
     * Handles user login process.
     * @param {ILoginRequest} credentials - User login credentials
     * @throws {Error} When login fails or server returns an error
     */
    const login = async (credentials: ILoginRequest) => {
        try {
            setLoading(true);
            setError(null);
            const response = await AuthService.login(credentials);
            
            if (response.error) {
                throw new Error(response.error);
            }

            if (!response.logged_in) {
                throw new Error('Login failed');
            }
            
            // Store the tokens in localStorage
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            localStorage.setItem('expires_in', response.data.expires_in.toString());
            
            // Update the auth context
            updateAuthState();
            
            // Redirect to dashboard or home page
            router.push('/');
            
            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'An error occurred during login';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles user logout process.
     * Clears local storage, updates auth state, and redirects to login page.
     */
    const logout = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Call the server to invalidate tokens
            const response = await AuthService.logout();
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            if (!response.logged_in) {
                // Clear local storage
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('expires_in');
                
                // Update auth context
                updateAuthState();
                
                // Redirect to login page
                router.push('/auth/auth1/login');
            } else {
                throw new Error('Logout failed: User is still logged in');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'An error occurred during logout';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Refreshes the authentication token.
     * @returns {Promise<boolean>} True if refresh successful, false otherwise
     */
    const refreshToken = async (): Promise<boolean> => {
        // TO DO: implement token refresh logic
        return true;
    };

    return { login, logout, refreshToken, loading, error };
};
