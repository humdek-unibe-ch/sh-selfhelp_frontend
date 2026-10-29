/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { useState } from 'react';
import { ActionIcon, Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconDownload, IconEye, IconFileZip, IconFiles } from '@tabler/icons-react';
import { API_CONFIG } from '../../../../../config/api.config';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';

/** Logical prefix the backend stores for form uploads (not a URL). */
const FORM_FILE_PREFIX = 'uploads/form-files/';

/** Stored form-upload keys in a data cell: one path or a JSON array of paths. */
export function getFormFilePaths(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  if (value.startsWith(FORM_FILE_PREFIX)) return [value];
  if (!value.startsWith('[')) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((p): p is string => typeof p === 'string' && p.startsWith(FORM_FILE_PREFIX))
      : [];
  } catch {
    return [];
  }
}

/** Ids of the given rows that hold at least one form upload (for the table zip). */
export function getRecordIdsWithFiles(rows: Record<string, unknown>[]): number[] {
  return rows
    .filter((row) => Object.values(row).some((value) => getFormFilePaths(value).length > 0))
    .map((row) => Number(row.record_id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

/** File name as uploaded: strips the `<timestamp>_<random>_` storage prefix. */
function originalName(path: string): string {
  return (path.split('/').pop() ?? path).replace(/^\d+_[0-9a-f]{8}_/, '');
}

interface IFormFileCellProps {
  recordId: number;
  fieldKey: string;
  paths: string[];
}

/** One file with View (new tab) and Download links, via the access-checked route. */
function FormFileLinks({ recordId, fieldKey, path, index }: { recordId: number; fieldKey: string; path: string; index: number }) {
  const name = originalName(path);
  const href = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FORMS_FILE.route(recordId, fieldKey)}?index=${index}`;
  return (
    <Group gap={4} wrap="nowrap">
      <Text size="sm" truncate maw={260}>{name}</Text>
      <Tooltip label="View">
        <ActionIcon variant="subtle" color="blue" component="a" href={href} target="_blank" rel="noopener noreferrer" aria-label={`View ${name}`}>
          <IconEye size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Download">
        <ActionIcon variant="subtle" color="green" component="a" href={href} download={name} aria-label={`Download ${name}`}>
          <IconDownload size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

/** A record's uploaded files: inline for one file, a list modal with a zip download for several. */
export function FormFileCell({ recordId, fieldKey, paths }: IFormFileCellProps) {
  const [opened, setOpened] = useState(false);

  if (paths.length === 1) {
    return <FormFileLinks recordId={recordId} fieldKey={fieldKey} path={paths[0]} index={0} />;
  }

  const zipHref = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FORMS_FILE_ZIP.route(recordId, fieldKey)}`;
  return (
    <>
      <Button size="compact-sm" variant="light" leftSection={<IconFiles size={14} />} onClick={() => setOpened(true)}>
        {`${paths.length} files`}
      </Button>
      <ModalWrapper
        opened={opened}
        onClose={() => setOpened(false)}
        onCancel={() => setOpened(false)}
        cancelLabel="Close"
        title={`Record ${recordId}: ${paths.length} files`}
        size="md"
        customActions={
          <Button component="a" href={zipHref} leftSection={<IconFileZip size={16} />}>
            Download all (zip)
          </Button>
        }
      >
        <Stack gap="xs">
          {paths.map((path, index) => (
            <FormFileLinks key={path} recordId={recordId} fieldKey={fieldKey} path={path} index={index} />
          ))}
        </Stack>
      </ModalWrapper>
    </>
  );
}
