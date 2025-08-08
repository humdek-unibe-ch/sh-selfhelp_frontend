"use client";

import { useMemo, useState } from 'react';
import { Accordion, Card, Stack, Text } from '@mantine/core';
import { useDataTables } from '../../../../../hooks/useData';
import SingleDataTable from './SingleDataTable';

interface IDataTablesViewerProps {
  activeTableIds: number[]; // includes -1 for all
  selectedUserId: number; // -1 means all
  showDeleted: boolean;
}

export function DataTablesViewer({ activeTableIds, selectedUserId, showDeleted }: IDataTablesViewerProps) {
  const { data: tablesResp, isLoading } = useDataTables();
  const tables = tablesResp?.dataTables || [];

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
        <Text c="dimmed">Loading data tables...</Text>
      </Card>
    );
  }

  if (selectedTables.length === 0) {
    return (
      <Card>
        <Text c="dimmed">No data tables available.</Text>
      </Card>
    );
  }

  return (
    <Accordion multiple defaultValue={selectedTables.map((t) => String(t.id))}>
      {selectedTables.map((t) => (
        <Accordion.Item key={t.id} value={String(t.id)}>
          <Accordion.Control>{t.displayName}</Accordion.Control>
          <Accordion.Panel>
            <SingleDataTable formId={t.id} tableName={t.name} displayName={t.displayName} selectedUserId={selectedUserId} showDeleted={showDeleted} />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}


