/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { ActionIcon, Group, Text } from '@mantine/core';
import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import classes from './AdminTable.module.css';

interface ISortHeaderProps {
  label: string;
  column: {
    getIsSorted: () => false | 'asc' | 'desc';
    toggleSorting: (desc?: boolean) => void;
  };
}

/** Sortable admin-table column header: label + a single sort-direction toggle. */
export function SortHeader({ label, column }: ISortHeaderProps) {
  const sorted = column.getIsSorted();
  return (
    <Group gap={4} wrap="nowrap" className={classes.sortHeader}>
      <Text span inherit>{label}</Text>
      <ActionIcon
        variant="transparent"
        color="gray"
        size="xs"
        aria-label={`Sort by ${label}`}
        onClick={() => column.toggleSorting(sorted === 'asc')}
      >
        {sorted === 'asc' ? (
          <IconSortAscending size={14} />
        ) : sorted === 'desc' ? (
          <IconSortDescending size={14} />
        ) : (
          <IconSortAscending size={14} opacity={0.35} />
        )}
      </ActionIcon>
    </Group>
  );
}
