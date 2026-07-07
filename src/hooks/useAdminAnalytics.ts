/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
 */
import { useQuery } from '@tanstack/react-query';
import { AdminAnalyticsApi, type IAnalyticsSummaryParams } from '../api/admin/analytics.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { useAuth } from './useAuth';

/** Page-view analytics summary for the admin dashboard. */
export function useAdminAnalyticsSummary(params: IAnalyticsSummaryParams, enabled = true) {
    const { isAuthenticated, user } = useAuth();

    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_ANALYTICS_SUMMARY(
            params.from ?? '',
            params.to ?? '',
            params.granularity ?? 'day',
            params.platform ?? 'all',
        ),
        queryFn: () => AdminAnalyticsApi.getSummary(params),
        enabled: enabled && !!isAuthenticated && !!user,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}

/** Today's operations snapshot (jobs, data submissions, visits). */
export function useAdminAnalyticsToday(enabled = true) {
    const { isAuthenticated, user } = useAuth();

    return useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_ANALYTICS_TODAY,
        queryFn: () => AdminAnalyticsApi.getToday(),
        enabled: enabled && !!isAuthenticated && !!user,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}
