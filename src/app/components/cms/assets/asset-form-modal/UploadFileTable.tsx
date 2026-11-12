/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import type { ReactNode } from 'react';
import { ActionIcon, Group, Loader, ScrollArea, Table, Text, TextInput, Tooltip } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

export type TRowStatus = 'idle' | 'waiting' | 'uploading' | 'done' | 'failed';

/** One row of the table: a file about to be uploaded, or the asset being edited. */
export interface IUploadRow {
  key: string;
  icon: ReactNode;
  /** Names the row for assistive technology: the file's name. */
  fileName: string;
  name: string;
  alt: string;
  /** Only images have alt text. */
  isImage: boolean;
  sizeLabel: string;
  /** A note under the name, e.g. the file that will replace the asset's file. */
  note?: string;
  status: TRowStatus;
  /** Why an upload failed. */
  message?: string;
  canRemove: boolean;
}

interface IUploadFileTableProps {
  rows: IUploadRow[];
  /** Whether the rows have a status (uploading); the edit form has none. */
  showStatus: boolean;
  disabled: boolean;
  onName: (key: string, value: string) => void;
  onAlt: (key: string, value: string) => void;
  onRemove: (key: string) => void;
  /** Rows shown before only the table scrolls. */
  maxHeight: number;
}

function StatusCell({ row }: { row: IUploadRow }) {
  if (row.status === 'uploading') {
    return <Group gap={6} wrap="nowrap"><Loader size="xs" /><Text size="xs">Uploading</Text></Group>;
  }
  if (row.status === 'done') {
    return <Group gap={4} wrap="nowrap" c="green"><IconCheck size={14} aria-hidden /><Text size="xs" c="green">Done</Text></Group>;
  }
  if (row.status === 'failed') {
    return (
      <Tooltip label={row.message} multiline maw={320} disabled={!row.message}>
        <div>
          <Text size="xs" c="red" fw={600}>Failed</Text>
          <Text size="xs" c="red" lineClamp={2}>{row.message}</Text>
        </div>
      </Tooltip>
    );
  }
  return <Text size="xs" c="dimmed">{row.status === 'waiting' ? 'Waiting' : ''}</Text>;
}

/**
 * The files of an upload (or the one asset being edited), one row each: type
 * icon, Name and Alt as inputs, size, upload status and a remove button. Only
 * this table scrolls when there are many rows; the rest of the form stays in
 * view.
 */
export function UploadFileTable({ rows, showStatus, disabled, onName, onAlt, onRemove, maxHeight }: IUploadFileTableProps) {
  return (
    <ScrollArea.Autosize mah={maxHeight} type="auto" offsetScrollbars>
      <Table verticalSpacing={6} horizontalSpacing="xs" stickyHeader aria-label="Files">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={32} aria-label="Type" />
            <Table.Th>Name</Table.Th>
            <Table.Th>Alt text</Table.Th>
            <Table.Th w={78}>Size</Table.Th>
            {showStatus && <Table.Th w={110}>Status</Table.Th>}
            <Table.Th w={36} aria-label="Remove" />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => {
            const locked = disabled || row.status === 'uploading' || row.status === 'done';
            return (
              <Table.Tr key={row.key}>
                <Table.Td>{row.icon}</Table.Td>
                <Table.Td>
                  <TextInput
                    size="xs"
                    aria-label={`Name of ${row.fileName}`}
                    value={row.name}
                    maxLength={255}
                    disabled={locked}
                    onChange={(event) => onName(row.key, event.currentTarget.value)}
                  />
                  {row.note && <Text size="xs" c="dimmed" truncate mt={2}>{row.note}</Text>}
                </Table.Td>
                <Table.Td>
                  {row.isImage ? (
                    <TextInput
                      size="xs"
                      aria-label={`Alt text of ${row.fileName}`}
                      placeholder="Describes the image"
                      value={row.alt}
                      maxLength={500}
                      disabled={locked}
                      onChange={(event) => onAlt(row.key, event.currentTarget.value)}
                    />
                  ) : (
                    <Text size="xs" c="dimmed">Images only</Text>
                  )}
                </Table.Td>
                <Table.Td><Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>{row.sizeLabel}</Text></Table.Td>
                {showStatus && <Table.Td><StatusCell row={row} /></Table.Td>}
                <Table.Td>
                  {row.canRemove && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      disabled={locked}
                      onClick={() => onRemove(row.key)}
                      aria-label={`Remove ${row.fileName}`}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea.Autosize>
  );
}
