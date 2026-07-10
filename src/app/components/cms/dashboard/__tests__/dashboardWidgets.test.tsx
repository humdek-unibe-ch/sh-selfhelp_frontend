/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import type { IAnalyticsSeriesPoint, IAnalyticsTopPage } from '../../../../../types/responses/admin/analytics.types';
import { StatCard } from '../StatCard';
import { TopPagesTable } from '../TopPagesTable';
import { VisitsChart } from '../VisitsChart';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => '/admin',
}));

// Recharts renders nothing measurable in jsdom; the chart itself is exercised
// by the metric toggle + empty state below, not by pixel assertions.

describe('admin dashboard widgets', () => {
    it('StatCard formats numeric values with locale separators and shows the hint', () => {
        renderWithProviders(
            <StatCard label="Page views" value={12345} icon={<span />} hint="2026-06-07 → 2026-07-06" />,
        );

        expect(screen.getByText('Page views')).toBeInTheDocument();
        expect(screen.getByText((12345).toLocaleString())).toBeInTheDocument();
        expect(screen.getByText('2026-06-07 → 2026-07-06')).toBeInTheDocument();
    });

    it('TopPagesTable links each page keyword to its admin editor', async () => {
        const pages: IAnalyticsTopPage[] = [
            { page_id: 1, keyword: 'home', url: '/home', views: 9, unique_visitors: 2 },
            { page_id: 2, keyword: 'about', url: '/about', views: 3, unique_visitors: 1 },
        ];
        renderWithProviders(<TopPagesTable pages={pages} />);

        await userEvent.click(screen.getByText('home'));
        expect(pushMock).toHaveBeenCalledWith('/admin/pages/home');
        expect(screen.getByText('about')).toBeInTheDocument();
    });

    it('TopPagesTable renders the empty state without rows', () => {
        renderWithProviders(<TopPagesTable pages={[]} />);

        expect(screen.getByText(/No page views recorded yet/i)).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('VisitsChart shows the empty state and switches the metric toggle', async () => {
        const onMetricChange = vi.fn();
        renderWithProviders(
            <VisitsChart series={[]} granularity="day" metric="views" onMetricChange={onMetricChange} />,
        );

        expect(screen.getByText(/No traffic recorded in this range yet/i)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('radio', { name: 'Visitors' }));
        expect(onMetricChange).toHaveBeenCalledWith('uniques');
    });

    it('VisitsChart labels the subtitle from metric and granularity', () => {
        const series: IAnalyticsSeriesPoint[] = [
            { period: '2026-07', web_views: 10, mobile_views: 4, web_uniques: 3, mobile_uniques: 1 },
        ];
        renderWithProviders(
            <VisitsChart series={series} granularity="month" metric="uniques" onMetricChange={() => undefined} />,
        );

        expect(screen.getByText(/Unique visitors per month, split by platform/i)).toBeInTheDocument();
    });
});
