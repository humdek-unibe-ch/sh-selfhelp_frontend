/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useEffect, useMemo, useState } from 'react';
import { Accordion, Card, Center, Loader, Text } from '@mantine/core';
import { useDataTables } from '../../../../../hooks/useData';
import SingleDataTable from './SingleDataTable';
import { EmptyState } from '../../../shared/common/EmptyState';

interface IDataTablesViewerProps {
  activeTableIds: number[]; // includes -1 for all
  selectedUserId: number; // -1 means all
  showDeleted: boolean;
  selectedLanguageId: number;
}

export function DataTablesViewer({ activeTableIds, selectedUserId, showDeleted, selectedLanguageId }: IDataTablesViewerProps) {
  const { data: tablesResp, isLoading } = useDataTables();
  const tables = tablesResp?.dataTables || [];
  const [opened, setOpened] = useState<string[]>([]);

  const tableIdsKey = useMemo(
    () => tables.map(t => t.id).join(','),
    [tables]
  );

  useEffect(() => {
    setOpened(prevOpened => {
      if (activeTableIds.length === 0) return [];
      if (activeTableIds.includes(-1)) {
        return prevOpened.filter(id => tables.some(t => String(t.id) === id));
      } else {
        const currentTableIds = new Set(activeTableIds.map(String));
        return prevOpened.filter(id => currentTableIds.has(id));
      }
    });
  }, [activeTableIds, tableIdsKey]);

  const selectedTables = useMemo(() => {
    if (!tables.length) return [] as { id: number; name: string; displayName: string }[];
    if (!activeTableIds || activeTableIds.length === 0) return [];
    if (activeTableIds.includes(-1)) return tables.map((t) => ({ id: t.id, name: t.name, displayName: t.displayName || t.name }));
    const set = new Set(activeTableIds);
    return tables.filter((t) => set.has(t.id)).map((t) => ({ id: t.id, name: t.name, displayName: t.displayName || t.name }));
  }, [tables, activeTableIds]);

  if (isLoading) {
    return (
      <Card>
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      </Card>
    );
  }

  if (selectedTables.length === 0) {
    return (
      <Card withBorder shadow="sm" radius="md">
        <EmptyState
          title="No data tables available"
          description=""
        />
      </Card>
    );
  }

  return (
    <Accordion multiple value={opened} onChange={setOpened}>
      {selectedTables.map((t) => (
        <Accordion.Item key={t.id} value={String(t.id)}>
          <Accordion.Control>{t.displayName}</Accordion.Control>
          <Accordion.Panel>
            {opened.includes(String(t.id)) ? (
              <SingleDataTable
                formId={t.id}
                tableName={t.name}
                displayName={t.displayName}
                selectedUserId={selectedUserId}
                showDeleted={showDeleted}
                selectedLanguageId={selectedLanguageId}
              />
            ) : (
              <Text c="dimmed" size="sm">Expand to load data…</Text>
            )}
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
