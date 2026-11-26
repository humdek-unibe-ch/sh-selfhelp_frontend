/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Switch, Text, Group, Box, ActionIcon, Tooltip } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { usePreviewMode } from '../../contexts/PreviewModeContext';
import { useIsClient } from '../../../../hooks/useIsClient';
import classes from './PreviewModeToggle.module.css';

interface IPreviewModeToggleProps {
    /** Custom label for the toggle (card variant only). */
    label?: string;
    /**
     * `card` — the previous control strip with status text (kept for callers
     * that still want it). `icon` — compact ActionIcon for the admin navbar
     * header row.
     */
    variant?: 'card' | 'icon';
    /** Rail button for the collapsed admin sidebar. */
    compact?: boolean;
}

function previewAriaLabel(isPreviewMode: boolean): string {
    return isPreviewMode
        ? 'Showing draft content, click to show published'
        : 'Showing published content, click to show draft';
}

function previewTooltip(isPreviewMode: boolean): string {
    return isPreviewMode ? 'Showing draft content' : 'Showing published content';
}

/**
 * Preview-mode toggle for the admin shell.
 *
 * The Switch (and its inner `<input type="checkbox">`) is mounted
 * **after** hydration for the card variant. Browser extensions that decorate
 * form inputs inject `data-*` attributes the moment the input lands in the
 * DOM; mounting the input client-side avoids a hydration mismatch.
 */
export function PreviewModeToggle({
    label = 'Preview Mode',
    variant = 'card',
    compact = false,
}: Readonly<IPreviewModeToggleProps>) {
    const { isPreviewMode, togglePreviewMode } = usePreviewMode();
    const mounted = useIsClient();

    if (variant === 'icon') {
        const active = mounted && isPreviewMode;
        return (
            <Tooltip label={previewTooltip(active)} withArrow position="bottom">
                <ActionIcon
                    variant="subtle"
                    size="md"
                    color={active ? 'orange' : 'gray'}
                    aria-label={previewAriaLabel(active)}
                    aria-pressed={active}
                    onClick={togglePreviewMode}
                    data-active={active || undefined}
                >
                    {active ? <IconEye size={18} stroke={1.6} /> : <IconEyeOff size={18} stroke={1.6} />}
                </ActionIcon>
            </Tooltip>
        );
    }

    // The status line replaces the label rather than appearing below it, so
    // enabling preview mode never reflows the surrounding layout.
    const statusText = mounted && isPreviewMode ? 'Showing draft content' : 'Showing published content';

    if (compact) {
        const active = mounted && isPreviewMode;
        return (
            <Tooltip label={`${label}: ${statusText.toLowerCase()}`} position="right" withArrow>
                <ActionIcon
                    variant={active ? 'light' : 'subtle'}
                    color={active ? 'orange' : 'gray'}
                    size="lg"
                    aria-label={label}
                    aria-pressed={active}
                    onClick={togglePreviewMode}
                >
                    {active ? <IconEye size={19} stroke={1.6} /> : <IconEyeOff size={19} stroke={1.6} />}
                </ActionIcon>
            </Tooltip>
        );
    }

    return (
        <Group gap="sm" wrap="nowrap" className={classes.root} data-active={mounted && isPreviewMode}>
            <Box className={classes.icon} aria-hidden>
                {mounted && isPreviewMode ? <IconEye size={18} stroke={1.6} /> : <IconEyeOff size={18} stroke={1.6} />}
            </Box>

            <Box className={classes.text}>
                <Text size="sm" fw={600} className={classes.label}>
                    {label}
                </Text>
                <Text size="xs" className={classes.status}>
                    {statusText}
                </Text>
            </Box>

            {mounted ? (
                <Switch
                    checked={isPreviewMode}
                    onChange={togglePreviewMode}
                    size="sm"
                    color="orange"
                    aria-label={label}
                />
            ) : (
                // Reserve the Switch's footprint so the layout doesn't jump on
                // the first client render. Mantine's `sm` Switch ≈ 38 × 20 px.
                <Box style={{ width: 38, height: 20 }} aria-hidden />
            )}
        </Group>
    );
}
