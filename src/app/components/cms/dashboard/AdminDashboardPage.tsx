/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo, useState } from 'react';
import {
    Alert,
    Grid,
    Group,
    SegmentedControl,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import {
    IconChartAreaLine,
    IconDeviceMobile,
    IconEye,
    IconInfoCircle,
    IconUsers,
    IconWorld,
} from '@tabler/icons-react';
import { useAuth } from '../../../../hooks/useAuth';
import { useAdminAnalyticsSummary, useAdminAnalyticsToday } from '../../../../hooks/useAdminAnalytics';
import type { TAnalyticsGranularity, TAnalyticsPlatform } from '../../../../types/responses/admin/analytics.types';
import { StatCard } from './StatCard';
import { VisitsChart } from './VisitsChart';
import { TopPagesTable } from './TopPagesTable';
import { ReferrersCard } from './ReferrersCard';
import { TodayOperationsPanel } from './TodayOperationsPanel';

type TRangeKey = '7d' | '30d' | '90d' | '12m' | 'all';

const RANGE_OPTIONS: Array<{ label: string; value: TRangeKey }> = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: '12 months', value: '12m' },
    { label: 'All time', value: 'all' },
];

function rangeToParams(range: TRangeKey): { from: string; to: string; granularity: TAnalyticsGranularity } {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const daysBack = (days: number): string => {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() - days);
        return date.toISOString().slice(0, 10);
    };
    switch (range) {
        case '7d':
            return { from: daysBack(6), to, granularity: 'day' };
        case '30d':
            return { from: daysBack(29), to, granularity: 'day' };
        case '90d':
            return { from: daysBack(89), to, granularity: 'day' };
        case '12m': {
            const date = new Date(today);
            date.setUTCMonth(date.getUTCMonth() - 11);
            date.setUTCDate(1);
            return { from: date.toISOString().slice(0, 10), to, granularity: 'month' };
        }
        case 'all':
            return { from: '2000-01-01', to, granularity: 'month' };
    }
}

/**
 * Admin dashboard: anonymous usage analytics (page views / unique visitors,
 * web vs mobile, top pages, external referrers) plus a today's-operations
 * snapshot for research instances (scheduled jobs, data submissions).
 *
 * Composed from small reusable pieces (`StatCard`, `VisitsChart`,
 * `TopPagesTable`, `ReferrersCard`, `TodayOperationsPanel`) so other admin
 * screens can reuse them later.
 */
export function AdminDashboardPage() {
    const { user, permissionChecker } = useAuth();
    const canReadAnalytics = permissionChecker?.canReadAnalytics() ?? false;

    const [range, setRange] = useState<TRangeKey>('30d');
    const [platform, setPlatform] = useState<TAnalyticsPlatform>('all');
    const [metric, setMetric] = useState<'views' | 'uniques'>('views');

    const params = useMemo(() => ({ ...rangeToParams(range), platform }), [range, platform]);
    const { data: summary, isLoading: isSummaryLoading } = useAdminAnalyticsSummary(params, canReadAnalytics);
    const { data: today, isLoading: isTodayLoading } = useAdminAnalyticsToday(canReadAnalytics);

    const greeting = user?.name ? `Welcome back, ${user.name}` : 'Welcome back';

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end" wrap="wrap">
                <div>
                    <Title order={2}>Dashboard</Title>
                    <Text size="sm" c="dimmed" mt={4}>{greeting} — here is how your site is doing.</Text>
                </div>
                {canReadAnalytics ? (
                    <Group gap="xs" wrap="wrap">
                        <SegmentedControl
                            size="xs"
                            value={platform}
                            onChange={(value) => setPlatform((value as TAnalyticsPlatform) || 'all')}
                            data={[
                                { label: 'All', value: 'all' },
                                { label: 'Web', value: 'web' },
                                { label: 'Mobile', value: 'mobile' },
                            ]}
                        />
                        <SegmentedControl
                            size="xs"
                            value={range}
                            onChange={(value) => setRange((value as TRangeKey) || '30d')}
                            data={RANGE_OPTIONS}
                        />
                    </Group>
                ) : null}
            </Group>

            {!canReadAnalytics ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                    Usage analytics require the <strong>admin.analytics.read</strong> permission.
                    Ask an administrator to grant it to your role to see traffic charts here.
                </Alert>
            ) : (
                <>
                    <TodayOperationsPanel today={today} isLoading={isTodayLoading} />

                    {isSummaryLoading || !summary ? (
                        <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
                            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={104} radius="md" />)}
                        </SimpleGrid>
                    ) : (
                        <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
                            <StatCard
                                label="Page views"
                                value={summary.totals.views}
                                icon={<IconEye size={20} />}
                                color="blue"
                                hint={`${summary.range.from} → ${summary.range.to}`}
                            />
                            <StatCard
                                label="Unique visitors"
                                value={summary.totals.unique_visitors}
                                icon={<IconUsers size={20} />}
                                color="teal"
                                hint="daily uniques, privacy-preserving"
                            />
                            <StatCard
                                label="Web views"
                                value={summary.totals.web.views}
                                icon={<IconWorld size={20} />}
                                color="indigo"
                                hint={`${summary.totals.web.unique_visitors.toLocaleString()} visitors`}
                            />
                            <StatCard
                                label="Mobile views"
                                value={summary.totals.mobile.views}
                                icon={<IconDeviceMobile size={20} />}
                                color="grape"
                                hint={`${summary.totals.mobile.unique_visitors.toLocaleString()} visitors`}
                            />
                        </SimpleGrid>
                    )}

                    {isSummaryLoading || !summary ? (
                        <Skeleton height={320} radius="md" />
                    ) : (
                        <VisitsChart
                            series={summary.series}
                            granularity={summary.range.granularity}
                            metric={metric}
                            onMetricChange={setMetric}
                        />
                    )}

                    {isSummaryLoading || !summary ? (
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 7 }}><Skeleton height={280} radius="md" /></Grid.Col>
                            <Grid.Col span={{ base: 12, md: 5 }}><Skeleton height={280} radius="md" /></Grid.Col>
                        </Grid>
                    ) : (
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 7 }}>
                                <TopPagesTable pages={summary.top_pages} />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 5 }}>
                                <ReferrersCard referrers={summary.referrers} />
                            </Grid.Col>
                        </Grid>
                    )}

                    <Group gap={6} c="dimmed">
                        <IconChartAreaLine size={14} />
                        <Text size="xs">
                            Tracking is anonymous: visitor identities rotate daily and no IP
                            addresses or personal data are stored.
                        </Text>
                    </Group>
                </>
            )}
        </Stack>
    );
}
