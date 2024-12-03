/**
 * Authentication Context Provider and Hook.
 * Manages global authentication state and provides methods to update it.
 * 
 * @module contexts/AuthContext
 */

"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IAuthState } from '@/types/api/auth.type';

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
    const [authState, setAuthState] = useState<IAuthState>({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        expiresIn: null
    });

    /**
     * Updates authentication state from localStorage
     */
    const updateAuthState = async () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const expiresIn = localStorage.getItem('expires_in');

        setAuthState({
            isAuthenticated: Boolean(accessToken && refreshToken),
            accessToken,
            refreshToken,
            expiresIn: expiresIn ? parseInt(expiresIn) : null
        });
    };

    /**
     * Handle auth state changes from API service
     */
    useEffect(() => {
        const handleAuthChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            const isAuthenticated = customEvent.detail.isAuthenticated;
            
            if (!isAuthenticated) {
                // Clear state if not authenticated
                setAuthState({
                    isAuthenticated: false,
                    accessToken: null,
                    refreshToken: null,
                    expiresIn: null
                });
            } else {
                // Update state from localStorage if authenticated
                updateAuthState();
            }
        };

        window.addEventListener('authStateChange', handleAuthChange);
        return () => window.removeEventListener('authStateChange', handleAuthChange);
    }, []);

    /**
     * Listen for storage events to sync state across tabs
     */
    useEffect(() => {
        const handleStorageChange = () => {
            updateAuthState();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    /**
     * Initial auth state update
     */
    useEffect(() => {
        updateAuthState();
    }, []);

    return (
        <AuthContext.Provider value={{ ...authState, updateAuthState }}>
            {children}
        </AuthContext.Provider>
    );
};
