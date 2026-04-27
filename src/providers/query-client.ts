/**
 * TanStack Query client factory.
 *
 * Follows the official SSR pattern from
 * https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr:
 *
 *  - Server: a fresh client per request (sharing across requests would leak
 *    one visitor's cache into another's render).
 *  - Browser: a single client for the lifetime of the tab so navigations
 *    share the cache.
 *
 * Callers outside the React tree (Refine's `authProvider`) use this same
 * factory so they read/write the same cache `<QueryClientProvider>` does.
 */

import { QueryClient, isServer } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS,
    });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
    if (isServer) return makeQueryClient();
    return (browserQueryClient ??= makeQueryClient());
}
