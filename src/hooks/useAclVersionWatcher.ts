/**
 * Watches the `aclVersion` field returned by `/auth/user-data` and surgically
 * invalidates the frontend navigation cache whenever it changes.
 *
 * This is the single mechanism by which permission-affecting actions (forms,
 * logins, admin role changes) propagate to the user's visible navigation.
 * Individual mutations never need to know about ACL: they simply invalidate
 * `['user-data']` (or rely on the window-focus refetch), and this watcher
 * handles the rest.
 *
 * Mount this hook once at the root of the client tree (ClientProviders).
 */

'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthUser } from './useUserData';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

export function useAclVersionWatcher(): void {
    const queryClient = useQueryClient();
    const { user } = useAuthUser();
    const previousVersionRef = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        const current = user?.aclVersion ?? null;

        if (previousVersionRef.current === undefined) {
            previousVersionRef.current = current;
            return;
        }

        if (current !== previousVersionRef.current) {
            previousVersionRef.current = current;
            // ACL changes can hide/show entire pages and individual sections,
            // so we invalidate every cache that encodes permission-filtered
            // content: navigation, admin tree, and the public page content
            // itself (keyed by keyword via PAGE_BY_KEYWORD).
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
            queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES });
            queryClient.invalidateQueries({ queryKey: ['page-by-keyword'] });
        }
    }, [user?.aclVersion, queryClient]);
}
