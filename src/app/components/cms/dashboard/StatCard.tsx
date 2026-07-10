/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Card, Group, Text, ThemeIcon } from '@mantine/core';

interface IStatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    /** Small helper line under the value (e.g. platform split). */
    hint?: string;
}

/** Compact metric tile used across the admin dashboard. */
export function StatCard({ label, value, icon, color = 'blue', hint }: IStatCardProps) {
    return (
        <Card withBorder radius="md" p="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase" lts="0.04em">
                        {label}
                    </Text>
                    <Text fz={28} fw={700} lh={1.2} mt={4}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </Text>
                    {hint ? (
                        <Text size="xs" c="dimmed" mt={2}>
                            {hint}
                        </Text>
                    ) : null}
                </div>
                <ThemeIcon size={38} radius="md" variant="light" color={color}>
                    {icon}
                </ThemeIcon>
            </Group>
        </Card>
    );
}
