import { jwtDecode } from 'jwt-decode';
import { IJwtPayload, IAuthUser } from '../types/auth/jwt-payload.types';

/**
 * Token storage keys
 */
export const TOKEN_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
};

/**
 * Store authentication tokens in localStorage
 */
export const storeTokens = (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);

    // Also set in cookie for middleware access
    document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=${accessToken}; path=/; max-age=${60 * 60}; SameSite=Strict`;
};

/**
 * Remove authentication tokens from localStorage
 */
export const removeTokens = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);

    // Also remove from cookies
    document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=; path=/; max-age=0; SameSite=Strict`;
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * Decode JWT token and extract user information
 */
export const getUserPayload = (token: string | null): IAuthUser | null => {
    if (!token) return null;

    try {
        const decoded = jwtDecode<IJwtPayload>(token);

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTime) {
            return null;
        }

        return {
            id: decoded.id_users,
            email: decoded.email,
            name: decoded.user_name || decoded.email,
            roles: decoded.roles || [],
            permissions: decoded.permissions || [],
        };
    } catch (error) {
        console.error('Failed to decode JWT token:', error);
        return null;
    }
};

/**
 * Check if the current user has a specific permission
 */
export const hasPermission = (permission: string, user: IAuthUser | null): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
};

/**
 * Get the current authenticated user from the stored token
 */
export const getCurrentUser = (): IAuthUser | null => {
    const token = getAccessToken();
    return getUserPayload(token);
};
