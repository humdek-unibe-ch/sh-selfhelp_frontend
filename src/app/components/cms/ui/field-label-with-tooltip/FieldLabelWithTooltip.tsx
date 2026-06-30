/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import {
    Group,
    Text,
    Popover,
    ActionIcon,
    Badge,
    Box,
    Stack,
    CopyButton,
    Tooltip,
    ScrollArea,
} from '@mantine/core';
import { IconInfoCircle, IconX, IconCopy, IconCheck } from '@tabler/icons-react';
import {
    helpTextForDisplay,
    type TFieldHelpExampleLanguage,
} from '../../../../../utils/field-help.utils';
import styles from './FieldLabelWithTooltip.module.css';

interface FieldLabelWithTooltipProps {
    /** The label text */
    label: string;
    /** The tooltip/help text */
    tooltip: string;
    /** Whether the field is required */
    required?: boolean;
    /** The locale code to display on the right side */
    locale?: string;
    /** Optional copy-able example (e.g. a JSON snippet) shown in the popover */
    example?: string | null;
    /** Language label/highlighting hint for the example block */
    exampleLanguage?: TFieldHelpExampleLanguage;
}

/**
 * Field label with a closable help popover (issue #56 field audit).
 *
 * The info icon opens a Popover that stays open until dismissed (X, Escape or
 * click-outside) instead of a hover tooltip that disappears. When an `example`
 * is supplied it is rendered as a formatted, copy-able code block so admins can
 * grab a working JSON/CSS/HTML snippet in one click. Used everywhere a field
 * shows help, so the look is consistent across the whole CMS editor.
 */
export function FieldLabelWithTooltip({
    label,
    tooltip,
    required = false,
    locale,
    example,
    exampleLanguage = 'text',
}: FieldLabelWithTooltipProps) {
    const [opened, setOpened] = useState(false);

    const displayHelp = helpTextForDisplay(tooltip);
    const hasExample = !!example && example.trim().length > 0;
    const hasHelp = displayHelp.length > 0 || hasExample;

    return (
        <Box className={styles.labelContainer}>
            <Group
                className={styles.labelWrapper}
                justify="space-between"
                wrap="nowrap"
                w="100%"
            >
                <Group gap={6} wrap="nowrap">
                    <Text size="sm" fw={500}>
                        {label}
                        {required && <Text span c="red"> *</Text>}
                    </Text>
                    {hasHelp && (
                        <Popover
                            opened={opened}
                            onChange={setOpened}
                            position="top-start"
                            withArrow
                            shadow="md"
                            width={360}
                            withinPortal
                            zIndex={10002}
                            trapFocus
                            closeOnEscape
                            closeOnClickOutside
                        >
                            <Popover.Target>
                                <ActionIcon
                                    variant="subtle"
                                    size="xs"
                                    color="gray"
                                    aria-label={`Help for ${label}`}
                                    onClick={() => setOpened((o) => !o)}
                                >
                                    <IconInfoCircle size="0.85rem" />
                                </ActionIcon>
                            </Popover.Target>
                            <Popover.Dropdown p="xs">
                                <Stack gap={8}>
                                    <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start">
                                        <Text fw={600} size="sm">{label}</Text>
                                        <ActionIcon
                                            variant="subtle"
                                            size="xs"
                                            color="gray"
                                            aria-label="Close help"
                                            onClick={() => setOpened(false)}
                                        >
                                            <IconX size="0.8rem" />
                                        </ActionIcon>
                                    </Group>

                                    {displayHelp && (
                                        <Text size="xs" c="dimmed" className={styles.helpText}>
                                            {displayHelp}
                                        </Text>
                                    )}

                                    {hasExample && (
                                        <Box className={styles.exampleBlock}>
                                            <Group justify="space-between" gap="xs" wrap="nowrap" className={styles.exampleHeader}>
                                                <Text size="10px" tt="uppercase" fw={600} c="dimmed">
                                                    {exampleLanguage} example
                                                </Text>
                                                <CopyButton value={example!} timeout={1500}>
                                                    {({ copied, copy }) => (
                                                        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow>
                                                            <ActionIcon
                                                                variant="subtle"
                                                                size="xs"
                                                                color={copied ? 'teal' : 'gray'}
                                                                aria-label="Copy example"
                                                                onClick={copy}
                                                            >
                                                                {copied ? <IconCheck size="0.8rem" /> : <IconCopy size="0.8rem" />}
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </CopyButton>
                                            </Group>
                                            <ScrollArea.Autosize mah={200} type="auto">
                                                <pre className={styles.exampleCode}>{example}</pre>
                                            </ScrollArea.Autosize>
                                        </Box>
                                    )}
                                </Stack>
                            </Popover.Dropdown>
                        </Popover>
                    )}
                </Group>
                {locale && (
                    <Badge
                        variant="light"
                        color="gray"
                        size="xs"
                        style={{ flexShrink: 0 }}
                    >
                        {locale}
                    </Badge>
                )}
            </Group>
        </Box>
    );
}
