'use client';

import { Switch, Text, Group, Box } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { usePreviewMode } from '../../contexts/PreviewModeContext';

interface IPreviewModeToggleProps {
    /** Custom label for the toggle */
    label?: string;
    /** Whether to show the label */
    showLabel?: boolean;
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
    showLabel = true,
}: IPreviewModeToggleProps) {
    const { isPreviewMode, togglePreviewMode } = usePreviewMode();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <Box>
            <Group gap="xs" align="center">
                {showLabel && (
                    <Text size="sm" fw={500}>
                        {label}
                    </Text>
                )}
                {mounted ? (
                    <Switch
                        checked={isPreviewMode}
                        onChange={togglePreviewMode}
                        size="md"
                        onLabel={<IconEye size={16} />}
                        offLabel={<IconEyeOff size={16} />}
                        color="orange"
                        styles={{
                            track: {
                                backgroundColor: isPreviewMode ? '#ff6b35' : undefined,
                            },
                        }}
                    />
                ) : (
                    // Reserve the Switch's footprint so the layout doesn't
                    // jump on the first client render. Mantine's `md`
                    // Switch ≈ 44 × 26 px.
                    <Box style={{ width: 44, height: 26 }} aria-hidden />
                )}
            </Group>
            {mounted && isPreviewMode && (
                <Text size="xs" c="orange" mt={4}>
                    Preview mode active - showing draft content
                </Text>
            )}
        </Box>
    );
}
