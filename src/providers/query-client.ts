/**
 * Module-level TanStack Query client.
 *
 * One instance per client bundle, shared by every component tree via
 * `QueryClientProvider` (see `providers.tsx`) and also consumed by code that
 * runs *outside* the React tree — most notably Refine's `authProvider`,
 * whose `check()` / `getIdentity()` lifecycle methods need to read the
 * hydrated `['user-data']` cache without forcing a fresh network round-trip.
 *
 * Kept in its own module (rather than inlined in `providers.tsx`) so both
 * the React-facing provider and the non-React consumers can import the same
 * singleton without creating a circular dependency.
 */

import { QueryClient } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

export const queryClient = new QueryClient({
    defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS,
});
