"use client";

import { Button, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

interface FilterActionsProps {
  onApply: () => void;
  onReset: () => void;
  onRefresh: () => void;
  isFetching: boolean;
  isApplyDisabled?: boolean;
  showReset?: boolean;
}

export function FilterActions({
  onApply,
  onReset,
  onRefresh,
  isFetching,
  isApplyDisabled = false,
  showReset = true,
}: FilterActionsProps) {
  return (
    <Group gap="sm" justify="flex-end" wrap="nowrap">
      <Button
        variant="filled"
        color="blue"
        onClick={onApply}
        loading={isFetching}
        disabled={isApplyDisabled}
      >
        Apply Filters
      </Button>

      {showReset && (
        <Button
          color="red"
          variant="filled"
          onClick={onReset}
          loading={isFetching}
        >
          Reset
        </Button>
      )}

      <Button
        variant="light"
        leftSection={<IconRefresh size={16} />}
        onClick={onRefresh}
        loading={isFetching}
        disabled={isFetching}
      >
        Refresh
      </Button>
    </Group>
  );
}