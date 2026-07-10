/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { AreaChart } from '@mantine/charts';
import { Card, Group, SegmentedControl, Text } from '@mantine/core';
import type { IAnalyticsSeriesPoint, TAnalyticsGranularity } from '../../../../types/responses/admin/analytics.types';

interface IVisitsChartProps {
    series: IAnalyticsSeriesPoint[];
    granularity: TAnalyticsGranularity;
    metric: 'views' | 'uniques';
    onMetricChange: (metric: 'views' | 'uniques') => void;
}

/**
 * Web vs mobile traffic area chart with a views/visitors metric toggle.
 * Periods come pre-aggregated from the backend (`day` or `month` buckets).
 */
export function VisitsChart({ series, granularity, metric, onMetricChange }: IVisitsChartProps) {
    const data = series.map((point) => ({
        period: point.period,
        Web: metric === 'views' ? point.web_views : point.web_uniques,
        Mobile: metric === 'views' ? point.mobile_views : point.mobile_uniques,
    }));

    return (
        <Card withBorder radius="md" p="md">
            <Group justify="space-between" align="center" mb="md" wrap="wrap">
                <div>
                    <Text fw={600}>Traffic</Text>
                    <Text size="xs" c="dimmed">
                        {metric === 'views' ? 'Page views' : 'Unique visitors'} per {granularity === 'month' ? 'month' : 'day'}, split by platform
                    </Text>
                </div>
                <SegmentedControl
                    size="xs"
                    value={metric}
                    onChange={(value) => onMetricChange(value === 'uniques' ? 'uniques' : 'views')}
                    data={[
                        { label: 'Views', value: 'views' },
                        { label: 'Visitors', value: 'uniques' },
                    ]}
                />
            </Group>
            {data.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                    No traffic recorded in this range yet. Views are counted when public pages load.
                </Text>
            ) : (
                <AreaChart
                    h={260}
                    data={data}
                    dataKey="period"
                    series={[
                        { name: 'Web', color: 'blue.6' },
                        { name: 'Mobile', color: 'teal.6' },
                    ]}
                    curveType="monotone"
                    withLegend
                    legendProps={{ verticalAlign: 'bottom', height: 36 }}
                    areaChartProps={{ syncId: 'dashboard-traffic' }}
                    valueFormatter={(value) => value.toLocaleString()}
                />
            )}
        </Card>
    );
}
