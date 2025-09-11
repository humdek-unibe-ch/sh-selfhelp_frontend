import { API_CONFIG } from '../config/api.config';

/**
 * Utility function to construct proper asset URLs for the frontend
 * Handles different path formats including external URLs, data URLs, and local paths
 *
 * @param filePath - The raw file path from the backend API or external URL
 * @returns The full URL pointing to the Symfony backend server or the original URL if external
 */
export const getAssetUrl = (filePath: string): string => {
    // Handle empty or null values
    if (!filePath || typeof filePath !== 'string') {
        return '';
    }

    const trimmedPath = filePath.trim();

    // If it's already a full HTTP/HTTPS URL, return as-is (external URLs)
    if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
        return trimmedPath;
    }

    // If it's a data URL (base64 encoded images), return as-is
    if (trimmedPath.startsWith('data:')) {
        return trimmedPath;
    }

    // Handle relative paths - these need to be processed through our backend
    let cleanPath = trimmedPath;

    // Remove any leading slashes
    if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    }

    // Handle admin prefixes that might be in the path
    if (cleanPath.startsWith('admin/uploads/')) {
        cleanPath = cleanPath.replace('admin/uploads/', 'uploads/');
    } else if (cleanPath.startsWith('admin/')) {
        cleanPath = cleanPath.replace('admin/', '');
    }

    // Ensure it starts with uploads/ if it doesn't already (for local assets)
    if (!cleanPath.startsWith('uploads/') && !cleanPath.startsWith('assets/')) {
        cleanPath = `uploads/${cleanPath}`;
    }

    // Return full URL pointing to Symfony backend
    return `${API_CONFIG.BACKEND_URL}/${cleanPath}`;
};
