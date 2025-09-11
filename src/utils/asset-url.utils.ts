import { API_CONFIG } from '../config/api.config';

/**
 * Utility function to construct proper asset URLs for the frontend
 * Handles different path formats and ensures they point to the Symfony backend
 *
 * @param filePath - The raw file path from the backend API
 * @returns The full URL pointing to the Symfony backend server
 */
export const getAssetUrl = (filePath: string): string => {
    // If it's already a full URL, return as-is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }

    // Remove any leading slashes and admin prefixes
    let cleanPath = filePath;
    if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    }
    if (cleanPath.startsWith('admin/uploads/')) {
        cleanPath = cleanPath.replace('admin/uploads/', 'uploads/');
    } else if (cleanPath.startsWith('admin/')) {
        cleanPath = cleanPath.replace('admin/', '');
    }

    // Ensure it starts with uploads/ if it doesn't already
    if (!cleanPath.startsWith('uploads/')) {
        cleanPath = `uploads/${cleanPath}`;
    }

    // Return full URL pointing to Symfony backend
    return `${API_CONFIG.BACKEND_URL}/${cleanPath}`;
};
