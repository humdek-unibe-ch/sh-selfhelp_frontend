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
};

/**
 * Remove authentication tokens from localStorage
 */
export const removeTokens = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * Set the access token to INVALID
 */
export const removeAccessToken = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'INVALID');

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
 * Decode JWT token and extract basic user information
 * Note: JWT no longer contains permissions, roles details, or language info
 * Use useUserData hook for complete user information
 */
export const getUserPayload = (token: string | null): { id: number; email: string; name: string; roles: string[] } | null => {
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
        };
    } catch (error) {

        return null;
    }
};

/**
 * Check if the current user has a specific permission
 * @deprecated Use useHasPermission hook instead for complete permission checking
 */
export const hasPermission = (permission: string, user: IAuthUser | null): boolean => {
    if (!user) return false;
    return user.permissions?.includes(permission) || false;
};

/**
 * Get basic user information from JWT token
 * @deprecated Use useAuthUser hook instead for complete user information
 */
export const getCurrentUser = (): { id: number; email: string; name: string; roles: string[] } | null => {
    const token = getAccessToken();
    return getUserPayload(token);
};
