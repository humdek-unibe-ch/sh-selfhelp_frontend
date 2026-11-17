/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import type { ReactNode } from 'react';
import { ActionIcon, Group, Paper, Stack, Text } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconTrash } from '@tabler/icons-react';

interface IFormListItemFrameProps {
    /** What the row is called in the accessible names ("Column Title"). */
    title: string;
    index: number;
    count: number;
    disabled?: boolean;
    onMove?: (from: number, to: number) => void;
    onRemove: () => void;
    children: ReactNode;
}

/** One row of a list editor: its fields and the controls to move or remove it. */
export function FormListItemFrame({ title, index, count, disabled = false, onMove, onRemove, children }: IFormListItemFrameProps) {
    return (
        <Paper withBorder p="xs" radius="sm" role="group" aria-label={title}>
            <Stack gap="xs">
                <Group justify="space-between" gap="xs" wrap="nowrap">
                    <Text size="xs" fw={600} c="dimmed" truncate>
                        {index + 1}. {title}
                    </Text>
                    <Group gap={4} wrap="nowrap">
                        {onMove !== undefined && (
                            <>
                                <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    aria-label={`Move ${title} up`}
                                    disabled={disabled || index === 0}
                                    onClick={() => onMove(index, index - 1)}
                                >
                                    <IconArrowUp size={14} />
                                </ActionIcon>
                                <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    aria-label={`Move ${title} down`}
                                    disabled={disabled || index === count - 1}
                                    onClick={() => onMove(index, index + 1)}
                                >
                                    <IconArrowDown size={14} />
                                </ActionIcon>
                            </>
                        )}
                        <ActionIcon size="sm" variant="subtle" color="red" aria-label={`Remove ${title}`} disabled={disabled} onClick={onRemove}>
                            <IconTrash size={14} />
                        </ActionIcon>
                    </Group>
                </Group>
                {children}
            </Stack>
        </Paper>
    );
}
