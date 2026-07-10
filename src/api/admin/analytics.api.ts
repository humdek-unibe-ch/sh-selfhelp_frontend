/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Admin Analytics API Service
 * Dashboard aggregates: page-view analytics and today's-operations snapshot.
 */

import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type {
    IAnalyticsSummary,
    IAnalyticsToday,
    TAnalyticsGranularity,
    TAnalyticsPlatform,
} from '../../types/responses/admin/analytics.types';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

export interface IAnalyticsSummaryParams {
    from?: string;
    to?: string;
    granularity?: TAnalyticsGranularity;
    platform?: TAnalyticsPlatform;
}

export const AdminAnalyticsApi = {
    /**
     * Page-view series, totals, top pages and referrers for a date range.
     */
    async getSummary(params: IAnalyticsSummaryParams = {}): Promise<IAnalyticsSummary> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IAnalyticsSummary>>(
            API_CONFIG.ENDPOINTS.ADMIN_ANALYTICS_SUMMARY,
            { params },
        );
        return response.data.data;
    },

    /**
     * Today's operations snapshot (scheduled jobs, data submissions, visits).
     */
    async getToday(): Promise<IAnalyticsToday> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IAnalyticsToday>>(
            API_CONFIG.ENDPOINTS.ADMIN_ANALYTICS_TODAY,
        );
        return response.data.data;
    },
};
