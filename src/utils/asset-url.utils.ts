/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Asset bytes are served only by the backend's access-checked delivery route
 * `GET /cms-api/v1/assets/{uuid}`.
 *
 * The browser must reach it through the BFF (`/api/assets/...`), NOT the
 * backend path directly. Symfony authorizes from the `Authorization: Bearer`
 * header, and the ONLY thing that attaches it is the `/api/*` catch-all proxy
 * (which reads the httpOnly `sh_auth`/`sh_impersonate` cookie server-side). The
 * proxy drops the header cleanly when there is no session, so anonymous reads
 * of public assets keep working.
 */
const DELIVERY_PREFIX = '/api/assets/';
const BACKEND_PREFIX = 'cms-api/v1/assets/';

/**
 * Turn an asset reference into a URL the browser can fetch.
 *
 * - absolute `http(s)` and `data:` URLs pass through untouched;
 * - the backend delivery URL (`asset.url`) is re-addressed onto the BFF;
 * - any other relative path (an already-BFF `/api/assets/...` URL or frontend
 *   static artwork under `/assets/...`) stays same-origin as-is.
 */
export const getAssetUrl = (value: string): string => {
    if (!value || typeof value !== 'string') {
        return '';
    }

    const trimmed = value.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
        return trimmed;
    }

    const path = trimmed.replace(/^\/+/, '');
    if (path.startsWith(BACKEND_PREFIX)) {
        return `${DELIVERY_PREFIX}${path.slice(BACKEND_PREFIX.length)}`;
    }

    return `/${path}`;
};
