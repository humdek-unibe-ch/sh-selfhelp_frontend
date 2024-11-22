import { useState } from 'react';
import { AuthService } from '@/services/api.service';
import { ILoginRequest, ILoginResponse } from '@/types/api/auth.type';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { updateAuthState } = useAuthContext();

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

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('expires_in');
        updateAuthState();
        router.push('/auth/auth1/login');
    };

    return {
        login,
        logout,
        loading,
        error
    };
};
