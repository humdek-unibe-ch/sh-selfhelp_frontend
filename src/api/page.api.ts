/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * API client for public page content.
 *
 * Browser entry points:
 *   - {@link resolvePageByPath} — public slug navigation + hover prefetch
 *     (`PAGE_BY_PATH` / shared `buildPagesResolvePath`, issue #30)
 *   - {@link getPageByKeyword} — admin, maintenance, Live Preview, and other
 *     keyword-addressed consumers (`PAGE_BY_KEYWORD`)
 *
 * SSR uses the matching `*SSRCached` helpers in `server-fetch.ts`.
 *
 * @module api/page.api
 */

import { buildPagesResolvePath } from '@selfhelp/shared';
import { permissionAwareApiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { type IBaseApiResponse, type IPageContent } from '../shared';
import { REFERRER_HOST_HEADER, consumeLandingReferrerHost } from '../utils/referrer-host.utils';

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
     * Resolve a full public URL path to its page content via the shared
     * `buildPagesResolvePath` contract (issue #30). Unlike
     * {@link getPageByKeyword} this carries the matched `route_params`
     * (snake_case) on the returned page.
     *
     * `X-Referrer-Host` is sent from the browser only when the landing
     * snapshot is still open: that means the server render did not deliver
     * the landing page, so this is the one chance to count the outside
     * referrer. A normal visit dismisses the snapshot when the SSR-seeded
     * query hydrates (`dismissLandingReferrerHost`), so a later language
     * switch or invalidation refetch of the same path carries none.
     */
    async resolvePageByPath(path: string, languageId?: number, preview?: boolean): Promise<IPageContent> {
        const route = {
            route: buildPagesResolvePath({ path, languageId, preview }),
            permissions: [],
        };
        const referrerHost = consumeLandingReferrerHost(path);

        const response = referrerHost
            ? await permissionAwareApiClient.get<IBaseApiResponse<{ page: IPageContent }>>(route, {
                  headers: { [REFERRER_HOST_HEADER]: referrerHost },
              })
            : await permissionAwareApiClient.get<IBaseApiResponse<{ page: IPageContent }>>(route);
        return response.data.data.page;
    },
};
