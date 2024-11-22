"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IAuthState } from '@/types/api/auth.type';

interface AuthContextType extends IAuthState {
    updateAuthState: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresIn: null,
    updateAuthState: () => {}
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [authState, setAuthState] = useState<IAuthState>({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        expiresIn: null
    });

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

    useEffect(() => {
        updateAuthState();
    }, []);

    return (
        <AuthContext.Provider value={{ ...authState, updateAuthState }}>
            {children}
        </AuthContext.Provider>
    );
};
