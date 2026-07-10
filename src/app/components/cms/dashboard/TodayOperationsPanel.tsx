/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Anchor, Badge, Card, Group, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import type { IAnalyticsToday } from '../../../../types/responses/admin/analytics.types';

interface ITodayOperationsPanelProps {
    today: IAnalyticsToday | undefined;
    isLoading: boolean;
}

const JOB_STATUS_COLORS: Record<string, string> = {
    done: 'green',
    queued: 'blue',
    failed: 'red',
    deleted: 'gray',
    running: 'yellow',
};

function OpsMetric({ label, value, hint }: { label: string; value: number; hint?: string }) {
    return (
        <div>
            <Text size="xs" c="dimmed" fw={600}>{label}</Text>
            <Text fz={22} fw={700} lh={1.2}>{value.toLocaleString()}</Text>
            {hint ? <Text size="xs" c="dimmed">{hint}</Text> : null}
        </div>
    );
}

/**
 * Today-at-a-glance operations panel for research/CMS instances: scheduled
 * jobs due/executed with status breakdown, form/data submissions, and the
 * live visit counters for the current UTC day.
 */
export function TodayOperationsPanel({ today, isLoading }: ITodayOperationsPanelProps) {
    const router = useRouter();

    if (isLoading || !today) {
        return (
            <Card withBorder radius="md" p="md">
                <Skeleton height={20} width={160} mb="md" />
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={54} />)}
                </SimpleGrid>
            </Card>
        );
    }

    return (
        <Card withBorder radius="md" p="md">
            <Group justify="space-between" align="center" mb="md">
                <div>
                    <Text fw={600}>Today&apos;s operations</Text>
                    <Text size="xs" c="dimmed">{today.date} (UTC)</Text>
                </div>
                <Anchor size="xs" onClick={() => router.push('/admin/scheduled-jobs')}>
                    Scheduled jobs
                </Anchor>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
                <OpsMetric label="Jobs due today" value={today.scheduled_jobs.due_today} />
                <OpsMetric label="Jobs executed" value={today.scheduled_jobs.executed_today} />
                <OpsMetric label="Data entries" value={today.data.entries_today} hint="submitted today" />
                <OpsMetric label="Users submitted" value={today.data.users_submitted_today} hint="distinct users" />
                <OpsMetric label="Data tables" value={today.data.total_tables} hint={`${today.data.total_rows.toLocaleString()} rows total`} />
                <OpsMetric
                    label="Visits today"
                    value={today.visits.views_today}
                    hint={`${today.visits.web_views_today.toLocaleString()} web · ${today.visits.mobile_views_today.toLocaleString()} mobile`}
                />
            </SimpleGrid>

            {Object.keys(today.scheduled_jobs.by_status).length > 0 ? (
                <Stack gap={6} mt="md">
                    <Text size="xs" c="dimmed" fw={600}>Jobs due today by status</Text>
                    <Group gap="xs">
                        {Object.entries(today.scheduled_jobs.by_status).map(([status, count]) => (
                            <Badge
                                key={status}
                                variant="light"
                                color={JOB_STATUS_COLORS[status.toLowerCase()] ?? 'blue'}
                            >
                                {status}: {count}
                            </Badge>
                        ))}
                    </Group>
                </Stack>
            ) : null}
        </Card>
    );
}
