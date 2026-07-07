/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Admin dashboard analytics response types.
 *
 * Mirrors `config/schemas/api/v1/responses/admin/analytics/*.json` in the
 * backend: anonymous page-view aggregates (series / totals / top pages /
 * referrers) and the today's-operations snapshot.
 */

export type TAnalyticsPlatform = 'all' | 'web' | 'mobile';
export type TAnalyticsGranularity = 'day' | 'month';

export interface IAnalyticsSeriesPoint {
    period: string;
    web_views: number;
    mobile_views: number;
    web_uniques: number;
    mobile_uniques: number;
}

export interface IAnalyticsPlatformTotals {
    views: number;
    unique_visitors: number;
}

export interface IAnalyticsTopPage {
    page_id: number;
    keyword: string;
    url: string | null;
    views: number;
    unique_visitors: number;
}

export interface IAnalyticsReferrer {
    host: string;
    views: number;
}

export interface IAnalyticsSummary {
    range: {
        from: string;
        to: string;
        granularity: TAnalyticsGranularity;
        platform: TAnalyticsPlatform;
    };
    totals: IAnalyticsPlatformTotals & {
        web: IAnalyticsPlatformTotals;
        mobile: IAnalyticsPlatformTotals;
    };
    series: IAnalyticsSeriesPoint[];
    top_pages: IAnalyticsTopPage[];
    referrers: IAnalyticsReferrer[];
}

export interface IAnalyticsToday {
    date: string;
    scheduled_jobs: {
        due_today: number;
        executed_today: number;
        by_status: Record<string, number>;
    };
    data: {
        entries_today: number;
        users_submitted_today: number;
        total_tables: number;
        total_rows: number;
    };
    visits: {
        views_today: number;
        unique_visitors_today: number;
        web_views_today: number;
        mobile_views_today: number;
    };
}
