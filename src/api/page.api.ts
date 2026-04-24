/**
 * API client for public page content.
 *
 * After the SSR + BFF refactor the only surviving browser-side entry point
 * is `getPageByKeyword`. Legacy helpers (`getPageContent`, `updatePageContent`,
 * `getPublicLanguages`) were replaced by:
 *   - `getPageByKeywordSSRCached` (server-fetch) for SSR prefetch + `generateMetadata`
 *   - `usePageContentByKeyword` / `usePageContentValue` hooks for client consumers
 *   - `usePublicLanguages` hook (and its SSR sibling `getPublicLanguagesSSR`) for languages
 *
 * ## Why by-keyword, not by-id
 * Fetching by keyword collapses the old `nav → id → content` waterfall
 * into a single parallel request, keys the React Query cache by the same
 * string the URL carries, and makes `usePagePrefetch.createHoverPrefetch`
 * warm the exact entry the next navigation will render. See
 * `docs/architecture/ssr-bff-architecture.md` §5 for the full rationale.
 *
 * @module api/page.api
 */

import { permissionAwareApiClient } from './base.api';
import { API_CONFIG } from '../config/api.config';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { IPageContent } from '../types/common/pages.type';

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
};
