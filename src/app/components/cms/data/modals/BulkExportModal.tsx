/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useMemo, useState } from 'react';
import { MultiSelect, SegmentedControl, Stack, Text } from '@mantine/core';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { useExportTablesZip } from '../../../../../hooks/useData';
import type { IDataTableSummary } from '../../../../../types/responses/admin/data.types';

interface IBulkExportModalProps {
  open: boolean;
  onClose: () => void;
  tables: IDataTableSummary[];
}

export function BulkExportModal({ open, onClose, tables }: IBulkExportModalProps) {
  const exportZip = useExportTablesZip();
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  const tableOptions = useMemo(
    () => tables.map((t) => ({ value: t.name, label: t.displayName || t.name })),
    [tables]
  );

  const handleExport = async () => {
    if (selectedNames.length === 0) return;
    await exportZip.mutateAsync({ table_names: selectedNames, format });
    setSelectedNames([]);
    onClose();
  };

  return (
    <ModalWrapper
      opened={open}
      onClose={onClose}
      title="Export data tables"
      onSave={handleExport}
      saveLabel="Export ZIP"
      onCancel={onClose}
      isLoading={exportZip.isPending}
      disabled={selectedNames.length === 0}
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Select one or more data tables to export. The result is a single ZIP archive
          containing one {format.toUpperCase()} file per table.
        </Text>
        <MultiSelect
          label="Data tables"
          placeholder="Pick tables to export"
          data={tableOptions}
          value={selectedNames}
          onChange={setSelectedNames}
          searchable
          clearable
        />
        <SegmentedControl
          value={format}
          onChange={(v) => setFormat(v as 'csv' | 'json')}
          data={[
            { label: 'CSV', value: 'csv' },
            { label: 'JSON', value: 'json' },
          ]}
        />
      </Stack>
    </ModalWrapper>
  );
}
