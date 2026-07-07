/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Card, Group, Progress, Stack, Text } from '@mantine/core';
import type { IAnalyticsReferrer } from '../../../../types/responses/admin/analytics.types';

interface IReferrersCardProps {
    referrers: IAnalyticsReferrer[];
}

/** External traffic sources (referrer hosts) for the selected range. */
export function ReferrersCard({ referrers }: IReferrersCardProps) {
    const maxViews = referrers.reduce((max, ref) => Math.max(max, ref.views), 0);

    return (
        <Card withBorder radius="md" p="md">
            <Text fw={600} mb={2}>Traffic sources</Text>
            <Text size="xs" c="dimmed" mb="sm">External sites that referred visitors</Text>
            {referrers.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="lg">
                    No external referrers recorded yet — direct visits and internal
                    navigation are not listed here.
                </Text>
            ) : (
                <Stack gap="xs">
                    {referrers.map((referrer) => (
                        <div key={referrer.host}>
                            <Group justify="space-between" gap="xs" mb={2}>
                                <Text size="sm" fw={500} truncate style={{ flex: 1 }}>
                                    {referrer.host}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    {referrer.views.toLocaleString()}
                                </Text>
                            </Group>
                            <Progress
                                value={maxViews > 0 ? (referrer.views / maxViews) * 100 : 0}
                                size="sm"
                                radius="xl"
                                color="grape"
                            />
                        </div>
                    ))}
                </Stack>
            )}
        </Card>
    );
}
