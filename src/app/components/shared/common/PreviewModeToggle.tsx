/**
 * Preview mode toggle component for admin panel.
 * Allows users to enable/disable preview mode for CMS pages.
 *
 * @module components/shared/common/PreviewModeToggle
 */

'use client';

import { Switch, Text, Group, Box } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { usePreviewMode } from '../../../../hooks/usePreviewMode';

interface IPreviewModeToggleProps {
  /** Custom label for the toggle */
  label?: string;
  /** Whether to show the label */
  showLabel?: boolean;
}

/**
 * Toggle component for enabling/disabling preview mode in the admin panel.
 * When enabled, all pages will be served with preview=true and be dynamic.
 */
export function PreviewModeToggle({ label = "Preview Mode", showLabel = true }: IPreviewModeToggleProps) {
  const { isPreviewMode, togglePreviewMode } = usePreviewMode();

  return (
    <Box>
      <Group gap="xs" align="center">
        {showLabel && (
          <Text size="sm" fw={500}>
            {label}
          </Text>
        )}
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
      </Group>
      {isPreviewMode && (
        <Text size="xs" c="orange" mt={4}>
          Preview mode active - showing draft content
        </Text>
      )}
    </Box>
  );
}
