/**
 * Authentication Context Provider and Hook.
 * Manages global authentication state and provides methods to update it.
 * 
 * @module contexts/AuthContext
 */

"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IAuthState } from '@/types/api/auth.type';
import { useAuth } from '@/hooks/useAuth';

/**
 * Extended authentication context type that includes update method
 */
interface AuthContextType extends IAuthState {
    /**
     * Updates authentication state from localStorage
     */
    updateAuthState: () => Promise<void>;
}

/**
 * Authentication context with default values
 */
const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresIn: null,
    updateAuthState: async () => {}
});

/**
 * Hook to access authentication context
 * @returns {AuthContextType} Authentication context value
 */
export const useAuthContext = () => useContext(AuthContext);

/**
 * Authentication Provider Component
 * Manages authentication state and provides methods to update it
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { data: authState, refetch } = useAuth();
    
    const updateAuthState = async () => {
        await refetch();
    };

    useEffect(() => {
        const handleAuthChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            refetch();
        };

        window.addEventListener('authStateChange', handleAuthChange);
        return () => window.removeEventListener('authStateChange', handleAuthChange);
    }, [refetch]);

    if (!authState) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ 
            ...authState,
            updateAuthState 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
