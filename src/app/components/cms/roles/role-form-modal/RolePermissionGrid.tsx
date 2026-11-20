/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useId, useMemo, useState } from 'react';
import {
  ActionIcon,
  Checkbox,
  Group,
  ScrollArea,
  Table,
  Text,
  TextInput,
  Tooltip,
  VisuallyHidden,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  GRID_ACTIONS,
  LOCKED_IMPLIED_READ,
  LOCKED_NOT_HELD,
  filterPermissionAreas,
  groupPermissionsByArea,
  type IPermissionOption,
} from './permission-picker.utils';

interface IRolePermissionGridProps {
  /** Every permission, with its lock already worked out (`buildPermissionOptions`). */
  options: readonly IPermissionOption[];
  /** Ticked permission ids. */
  value: readonly string[];
  onChange: (value: string[]) => void;
  /** The whole grid is read-only (no right to change the list, or a role the caller may not change). */
  disabled?: boolean;
}

const COLUMN_LABELS: Record<(typeof GRID_ACTIONS)[number], string> = {
  read: 'Read',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
};

/**
 * The permissions of a role as a grid: one row per area, one column per action
 * (Read, Create, Update, Delete, Other). The search filters rows and stays while
 * boxes are ticked. A locked box is disabled and says why (hover, and for screen
 * readers its description).
 */
export function RolePermissionGrid({ options, value, onChange, disabled = false }: IRolePermissionGridProps) {
  const [search, setSearch] = useState('');
  const uid = useId();
  const reasonIds: Record<string, string> = {
    [LOCKED_NOT_HELD]: `${uid}-not-held`,
    [LOCKED_IMPLIED_READ]: `${uid}-implied-read`,
  };

  const areas = useMemo(() => groupPermissionsByArea(options), [options]);
  const visibleAreas = useMemo(() => filterPermissionAreas(areas, search), [areas, search]);
  const ticked = useMemo(() => new Set(value), [value]);

  const toggle = (id: string, checked: boolean) => {
    onChange(checked ? [...value.filter((item) => item !== id), id] : value.filter((item) => item !== id));
  };

  const renderBox = (option: IPermissionOption, label?: string) => {
    const box = (
      <Checkbox
        size="sm"
        label={label}
        aria-label={option.label === option.name ? option.name : `${option.label} (${option.name})`}
        checked={ticked.has(option.value)}
        disabled={disabled || option.disabled}
        aria-describedby={option.lockedReason ? reasonIds[option.lockedReason] : undefined}
        onChange={(event) => toggle(option.value, event.currentTarget.checked)}
      />
    );
    return (
      <Tooltip
        key={option.value}
        withArrow
        multiline
        maw={280}
        openDelay={300}
        label={
          <>
            <Text size="xs">{option.label}</Text>
            <Text size="xs" c="dimmed">{option.name}</Text>
            {option.lockedReason && <Text size="xs" fs="italic">{option.lockedReason}</Text>}
          </>
        }
      >
        {/* A disabled input fires no mouse events, so the tooltip hangs on a wrapper. */}
        <span style={{ display: 'inline-flex' }}>{box}</span>
      </Tooltip>
    );
  };

  return (
    <div>
      <VisuallyHidden id={reasonIds[LOCKED_NOT_HELD]}>{LOCKED_NOT_HELD}</VisuallyHidden>
      <VisuallyHidden id={reasonIds[LOCKED_IMPLIED_READ]}>{LOCKED_IMPLIED_READ}</VisuallyHidden>

      <Group justify="space-between" mb="xs" wrap="nowrap" gap="md">
        <TextInput
          aria-label="Search permissions"
          placeholder="Search areas or permissions…"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          rightSection={
            search ? (
              <ActionIcon aria-label="Clear search" variant="subtle" color="gray" size="sm" onClick={() => setSearch('')}>
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          style={{ flex: 1 }}
        />
        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {value.length} of {options.length} selected
        </Text>
      </Group>

      <ScrollArea h={380} type="auto" offsetScrollbars>
        <Table striped highlightOnHover stickyHeader verticalSpacing={6}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ minWidth: 160 }}>Area</Table.Th>
              {GRID_ACTIONS.map((action) => (
                <Table.Th key={action} style={{ textAlign: 'center', width: 72 }}>
                  {COLUMN_LABELS[action]}
                </Table.Th>
              ))}
              <Table.Th>Other</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleAreas.map((area) => (
              <Table.Tr key={area.key}>
                <Table.Td>
                  <Text size="sm" fw={500}>{area.label}</Text>
                </Table.Td>
                {GRID_ACTIONS.map((action) => {
                  const option = area.actions[action];
                  return (
                    <Table.Td key={action} style={{ textAlign: 'center' }}>
                      {option ? (
                        <Group justify="center">{renderBox(option)}</Group>
                      ) : (
                        <Text size="sm" c="dimmed" aria-hidden="true">–</Text>
                      )}
                    </Table.Td>
                  );
                })}
                <Table.Td>
                  <Group gap="md">{area.other.map(({ action, option }) => renderBox(option, action))}</Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {visibleAreas.length === 0 && (
          <Text ta="center" c="dimmed" py="xl" size="sm">
            No permission matches your search.
          </Text>
        )}
      </ScrollArea>
    </div>
  );
}
