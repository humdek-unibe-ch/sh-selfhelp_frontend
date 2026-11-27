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

import { buildPagesResolvePath, pageFromPayload, type IPagePayload } from '@selfhelp/shared';
import { permissionAwareApiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { type IBaseApiResponse, type IPageContent } from '../shared';
import { REFERRER_HOST_HEADER, consumeLandingReferrerHost } from '../utils/referrer-host.utils';
import { PAGE_VIEW_HEADER, PAGE_VIEW_HEADER_VALUE } from '../utils/page-view.utils';

/** Options of {@link PageApi.resolvePageByPath}. */
export interface IResolvePageByPathOptions {
    /**
     * This fetch is the one that counts the page view (`X-Page-View: 1`, C7). Only the fetch that
     * loads a page for a navigation sets it. Prefetch, live refetch, `valid_until` refetch and
     * preview never do, and it is ignored for preview.
     */
    countView?: boolean;
}

/** The page of a response, with the live-sync block that travels next to it. */
function unwrapPage(payload: IPagePayload): IPageContent {
    // The callers have always read `data.page` without a guard; a response without a page is a server fault they surface.
    return pageFromPayload(payload) as IPageContent;
}

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

        const response = await permissionAwareApiClient.get<IBaseApiResponse<IPagePayload>>(
            API_CONFIG.ENDPOINTS.PAGES_GET_BY_KEYWORD,
            keyword,
            { params: queryParams }
        );
        return unwrapPage(response.data.data);
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
     *
     * `X-Page-View: 1` is sent only when `options.countView` is set (and never for preview), on
     * the same request that may carry the referrer.
     */
    async resolvePageByPath(
        path: string,
        languageId?: number,
        preview?: boolean,
        options: IResolvePageByPathOptions = {},
    ): Promise<IPageContent> {
        const route = {
            route: buildPagesResolvePath({ path, languageId, preview }),
            permissions: [],
        };
        const referrerHost = consumeLandingReferrerHost(path);
        const requestHeaders: Record<string, string> = {
            ...(options.countView && !preview ? { [PAGE_VIEW_HEADER]: PAGE_VIEW_HEADER_VALUE } : {}),
            ...(referrerHost ? { [REFERRER_HOST_HEADER]: referrerHost } : {}),
        };

        const response = Object.keys(requestHeaders).length > 0
            ? await permissionAwareApiClient.get<IBaseApiResponse<IPagePayload>>(route, {
                  headers: requestHeaders,
              })
            : await permissionAwareApiClient.get<IBaseApiResponse<IPagePayload>>(route);
        return unwrapPage(response.data.data);
    },
};
