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
    updateAuthState: () => void;
}

/**
 * Authentication context with default values
 */
const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresIn: null,
    updateAuthState: () => {}
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
    /**
     * Authentication state
     */
    const [authState, setAuthState] = useState<IAuthState>({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        expiresIn: null
    });

    /**
     * Updates authentication state from localStorage
     */
    const updateAuthState = () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const expiresIn = localStorage.getItem('expires_in');
        
        if (accessToken && refreshToken) {
            setAuthState({
                isAuthenticated: true,
                accessToken,
                refreshToken,
                expiresIn: expiresIn ? parseInt(expiresIn) : null
            });
        } else {
            setAuthState({
                isAuthenticated: false,
                accessToken: null,
                refreshToken: null,
                expiresIn: null
            });
        }
    };

    // Initialize auth state on mount
    useEffect(() => {
        updateAuthState();
    }, []);

    return (
        <AuthContext.Provider value={{
            ...authState,
            updateAuthState
        }}>
            {children}
        </AuthContext.Provider>
    );
};
