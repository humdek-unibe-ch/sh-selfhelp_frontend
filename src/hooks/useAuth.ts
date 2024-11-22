import { useState } from 'react';
import { AuthService } from '@/services/api.service';
import { ILoginRequest, ILoginResponse } from '@/types/api/auth.type';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const login = async (credentials: ILoginRequest) => {
        try {
            setLoading(true);
            setError(null);
            const response = await AuthService.login(credentials);
            
            // Store the token in localStorage or a secure cookie
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            // Redirect to dashboard or home page
            router.push('/');
            
            return response;
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred during login');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/auth1/login');
    };

    return {
        login,
        logout,
        loading,
        error
    };
};
