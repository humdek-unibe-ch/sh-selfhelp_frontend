/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The ACL-enforced delivery route that serves asset bytes (core >=0.1.41).
 *
 * Files moved out of the document root, so `uploads/assets/...` is no longer
 * fetchable: every byte now goes through the backend's
 * `GET /cms-api/v1/assets/{folder}/{file}`, which authorizes the request
 * against the folder ACLs.
 *
 * We address it through the BFF (`/api/assets/...`), NOT the backend path
 * directly. Symfony authorizes from the `Authorization: Bearer` header, and the
 * ONLY thing that attaches it is the `/api/*` catch-all proxy (which reads the
 * httpOnly `sh_auth`/`sh_impersonate` cookie server-side). A plain rewrite to
 * `/cms-api/v1/...` reaches Symfony ANONYMOUS — admins see nothing and granted
 * users see nothing, because the identity never arrives. The proxy also drops
 * the header cleanly when there is no session, so anonymous reads of
 * open-access folders keep working.
 */
const DELIVERY_PREFIX = '/api/assets/';

/**
 * The pre-0.1.41 logical key still returned as `file_path`. It is an identity
 * key, NOT a fetchable path — we map it onto the delivery route so any straggler
 * that hands us one still renders instead of 404ing.
 */
const LEGACY_UPLOADS_PREFIX = 'uploads/assets/';

/**
 * Utility function to construct proper asset URLs for the frontend
 * Handles different path formats including external URLs, data URLs, and local paths
 *
 * Prefer passing the backend-provided `asset.url` (already the delivery route).
 * `file_path` is a logical key and must not be used to fetch bytes.
 *
 * @param filePath - The asset `url`, an external URL, or a legacy relative path
 * @returns A same-origin URL the browser can fetch, or the original URL if external
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

    // `public/assets/*` is frontend-owned static artwork (the app logos),
    // checked into this repo and served by Next itself. It is NOT the backend's
    // `uploads/assets/*`: no folder, no ACL, no asset row — so keep it off the
    // delivery route, which would look for a folder of that name and 404.
    if (cleanPath.startsWith('assets/')) {
        return `/${cleanPath}`;
    }

    // Already routed through the BFF — leave it alone (idempotent).
    if (cleanPath.startsWith('api/assets/')) {
        return `/${cleanPath}`;
    }

    // The backend-shaped delivery route (the normal path: `asset.url`).
    // Re-address it onto the BFF so the proxy attaches the bearer token; an
    // <img> cannot send that header itself and browser code must never read
    // the JWT.
    if (cleanPath.startsWith('cms-api/v1/assets/')) {
        return `${DELIVERY_PREFIX}${cleanPath.slice('cms-api/v1/assets/'.length)}`;
    }

    // Legacy logical key (`uploads/assets/<folder>/<file>`) -> delivery route.
    if (cleanPath.startsWith(LEGACY_UPLOADS_PREFIX)) {
        return `${DELIVERY_PREFIX}${cleanPath.slice(LEGACY_UPLOADS_PREFIX.length)}`;
    }

    // Any other legacy relative form (`uploads/<...>` or a bare name) is a
    // pre-0.1.41 upload path; route it through delivery too.
    const relative = cleanPath.startsWith('uploads/')
        ? cleanPath.slice('uploads/'.length)
        : cleanPath;

    return `${DELIVERY_PREFIX}${relative}`;
};
