/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * SectionInspectorHeader — the section inspector's own header, laid out in three
 * stacked rows (title + ID pill, style badges, then actions) for a cleaner, more
 * scannable top of the panel. Local to the section inspector; the page inspector
 * composes its own header.
 *
 * Presentation only — the Save / Export / Delete handlers and disabled/loading
 * state are passed in from `SectionInspector`.
 *
 * @module components/cms/pages/section-inspector/SectionInspectorHeader
 */

import { Box, Group, Stack, Title, Badge, Button, ActionIcon, Tooltip } from '@mantine/core';
import { IconDeviceFloppy, IconFileExport, IconTrash } from '@tabler/icons-react';

interface ISectionInspectorHeaderProps {
    title: string;
    /** Small neutral id pill shown next to the title (e.g. "ID 230"). */
    idLabel: string;
    /** Style descriptor badges shown on their own row. */
    badges: Array<{ label: string; color: string }>;
    onSave: () => void;
    onExport: () => void;
    onDelete: () => void;
    saving?: boolean;
    disabled?: boolean;
}

export function SectionInspectorHeader({
    title,
    idLabel,
    badges,
    onSave,
    onExport,
    onDelete,
    saving = false,
    disabled = false,
}: ISectionInspectorHeaderProps) {
    return (
        <Box p="md">
            <Stack gap="sm">
                {/* Row 1 — title + neutral ID pill */}
                <Group gap="xs" align="center" wrap="nowrap">
                    <Title order={3} style={{ wordBreak: 'break-word', lineHeight: 1.2 }}>
                        {title}
                    </Title>
                    <Badge color="gray" variant="light" radius="sm" style={{ flexShrink: 0 }}>
                        {idLabel}
                    </Badge>
                </Group>

                {/* Row 2 — style descriptor badges */}
                {badges.length > 0 && (
                    <Group gap="xs" wrap="wrap">
                        {badges.map((badge) => (
                            <Badge key={badge.label} color={badge.color} variant="light" radius="sm">
                                {badge.label}
                            </Badge>
                        ))}
                    </Group>
                )}

                {/* Row 3 — actions: wide Save, Export outline, icon-only Delete */}
                <Group gap="xs" wrap="nowrap" align="stretch">
                    <Button
                        flex={1}
                        leftSection={<IconDeviceFloppy size="1rem" />}
                        onClick={onSave}
                        variant="filled"
                        loading={saving}
                        disabled={disabled}
                    >
                        Save
                    </Button>
                    <Button
                        leftSection={<IconFileExport size="1rem" />}
                        onClick={onExport}
                        variant="default"
                        disabled={disabled}
                    >
                        Export
                    </Button>
                    <Tooltip label="Delete section" withArrow>
                        <ActionIcon
                            onClick={onDelete}
                            variant="light"
                            color="red"
                            size="lg"
                            aria-label="Delete section"
                            disabled={disabled}
                        >
                            <IconTrash size="1.1rem" />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Stack>
        </Box>
    );
}
