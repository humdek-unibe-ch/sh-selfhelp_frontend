/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Switch, Text, Group, Box } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { usePreviewMode } from '../../contexts/PreviewModeContext';
import { useIsClient } from '../../../../hooks/useIsClient';
import classes from './PreviewModeToggle.module.css';

interface IPreviewModeToggleProps {
    /** Custom label for the toggle */
    label?: string;
}

/**
 * Preview-mode toggle for the admin shell.
 *
 * The Switch (and its inner `<input type="checkbox">`) is mounted
 * **after** hydration. Browser extensions that decorate form inputs (e.g.
 * Shark, password managers, ad-blocker shims) inject `data-*` attributes
 * the moment the input lands in the DOM; if the input were already in the
 * SSR HTML, React's hydration check would see those extension-added
 * attributes as a mismatch and warn:
 *
 *     A tree hydrated but some attributes of the server rendered HTML
 *     didn't match the client properties.  ... data-sharkid="…"
 *
 * Mounting the input client-side avoids that entirely. The label still
 * renders during SSR so the navbar layout doesn't reflow on hydration —
 * we only defer the interactive Switch portion.
 */
export function PreviewModeToggle({
    label = 'Preview Mode',
}: IPreviewModeToggleProps) {
    const { isPreviewMode, togglePreviewMode } = usePreviewMode();
    const mounted = useIsClient();

    // The status line replaces the label rather than appearing below it, so
    // enabling preview mode never reflows the surrounding layout.
    const statusText = mounted && isPreviewMode ? 'Showing draft content' : 'Showing published content';

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
