/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
    const previousAclSignatureRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        const currentSignature = `${user?.id ?? 'guest'}:${user?.aclVersion ?? 'none'}`;

        if (previousAclSignatureRef.current === undefined) {
            previousAclSignatureRef.current = currentSignature;
            // First authenticated mount can happen right after login with
            // user-data already hydrated. In that case there is no "change"
            // event to trigger invalidation, but we still must refresh
            // permission-filtered navigation immediately.
            if (user?.id != null) {
                void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES_ALL });
                void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.NAVIGATION_ALL });
                void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES });
                void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
            }
            return;
        }

        if (currentSignature !== previousAclSignatureRef.current) {
            previousAclSignatureRef.current = currentSignature;
            // ACL changes can hide/show entire pages and individual sections,
            // so we invalidate every cache that encodes permission-filtered
            // content: navigation, admin tree, and the public page content
            // itself (keyed by keyword via PAGE_BY_KEYWORD).
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FRONTEND_PAGES_ALL });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES });
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
        }
    }, [user?.id, user?.aclVersion, queryClient]);
}
