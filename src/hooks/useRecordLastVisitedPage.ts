/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useEffect, useRef } from 'react';
import { NavigationApi } from '../api/navigation.api';
import { useAuth } from './useAuth';

/**
 * Persists the last visited normal page for logged-in users (web platform).
 */
export function useRecordLastVisitedPage(
    pageId: number,
    keyword: string,
    url: string | null | undefined,
    enabled = true,
): void {
    const { isAuthenticated } = useAuth();
    const lastRecordedRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled || !isAuthenticated || pageId <= 0 || !keyword) {
            return;
        }
        if (lastRecordedRef.current === pageId) {
            return;
        }
        lastRecordedRef.current = pageId;
        void NavigationApi.recordLastVisited({
            page_id: pageId,
            keyword,
            url: url ?? undefined,
            platform: 'web',
        }).catch(() => {
            lastRecordedRef.current = null;
        });
    }, [enabled, isAuthenticated, pageId, keyword, url]);
}
