/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * API client for public page content.
 *
 * Browser entry points:
 *   - {@link resolvePageByPath} — public slug navigation + hover prefetch
 *     (`PAGE_BY_PATH` / `GET /pages/resolve`, issue #30)
 *   - {@link getPageByKeyword} — admin, maintenance, Live Preview, and other
 *     keyword-addressed consumers (`PAGE_BY_KEYWORD`)
 *
 * SSR uses the matching `*SSRCached` helpers in `server-fetch.ts`.
 *
 * @module api/page.api
 */

import { permissionAwareApiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { type IBaseApiResponse, type IPageContent } from '../shared';

export const PageApi = {
    /**
     * Fetch a page's full content using its keyword. Avoids the navigation →
     * page-id waterfall during slug navigation, and is the endpoint that the
     * SSR layout + `generateMetadata` rely on for a single-round-trip
     * initial render.
     */
    async getPageByKeyword(keyword: string, languageId?: number, preview?: boolean): Promise<IPageContent> {
        const queryParams: Record<string, string> = {};
        if (languageId) queryParams.language_id = languageId.toString();
        if (preview) queryParams.preview = 'true';

        const response = await permissionAwareApiClient.get<IBaseApiResponse<{ page: IPageContent }>>(
            API_CONFIG.ENDPOINTS.PAGES_GET_BY_KEYWORD,
            keyword,
            { params: queryParams }
        );
        return response.data.data.page;
    },

    /**
     * Resolve a full public URL path to its page content via the DB-driven
     * `page_routes` contract (issue #30). Unlike {@link getPageByKeyword} this
     * carries the matched `route_params` (snake_case) on the returned page, so
     * parameterized URLs (`/reset/42/abc`, `/team/7`) render the right record
     * and the auth styles can read `page.route_params.user_id` / `.token`.
     */
    async resolvePageByPath(path: string, languageId?: number, preview?: boolean): Promise<IPageContent> {
        const queryParams: Record<string, string> = { path };
        if (languageId) queryParams.language_id = languageId.toString();
        if (preview) queryParams.preview = 'true';

        const response = await permissionAwareApiClient.get<IBaseApiResponse<{ page: IPageContent }>>(
            API_CONFIG.ENDPOINTS.PAGES_RESOLVE,
            { params: queryParams }
        );
        return response.data.data.page;
    },
};
