"use client";

import { useMemo, useState, useCallback } from 'react';
import { Box, Button, Card, Checkbox, Group, MultiSelect, Select, Stack, Text, Title } from '@mantine/core';
import { IconDatabaseSearch, IconSettings } from '@tabler/icons-react';
import { useDataTables, useDataRows, DATA_QUERY_KEYS } from '../../../../../hooks/useData';
import { useUsers } from '../../../../../hooks/useUsers';
import type { IUserBasic } from '../../../../../types/responses/admin/users.types';
import { DataTablesViewer } from '../tables/DataTablesViewer';

export function DataAdminPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(-1);
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
  const [activeTableIds, setActiveTableIds] = useState<number[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [activeSelectedUserId, setActiveSelectedUserId] = useState<number>(-1);
  const [activeShowDeleted, setActiveShowDeleted] = useState<boolean>(false);

  // Users - fetch reasonable amount for dropdown, can be searched if needed
  const { data: usersResp } = useUsers({ page: 1, pageSize: 100, sort: 'email', sortDirection: 'asc' });
  const { data: tablesResp } = useDataTables();

  const userOptions = useMemo(() => {
    const users: IUserBasic[] = usersResp?.users || [];
    const options = users.map((u) => ({ value: String(u.id), label: u.email }));
    return [{ value: String(-1), label: 'All users' }, ...options];
  }, [usersResp]);

  const tableOptions = useMemo(() => {
    const tables = tablesResp?.dataTables || [];
    return tables.map((t) => ({ value: String(t.id), label: t.displayName || t.name }));
  }, [tablesResp]);

  const handleSearch = useCallback(() => {
    // Apply filters only when Search is pressed
    setActiveSelectedUserId(selectedUserId ?? -1);
    setActiveShowDeleted(showDeleted);
    if (selectedTableIds.includes(-1)) { setActiveTableIds([-1]); return; }
    setActiveTableIds([...selectedTableIds]);
  }, [selectedTableIds, selectedUserId, showDeleted]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Group gap="sm" align="center">
            <IconSettings size={24} />
            <Title order={2}>Data Management</Title>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>
            Explore and manage form data across users and tables
          </Text>
        </div>
      </Group>

      <Card>
        <Group align="end" gap="md">
          <Select
            label="User"
            placeholder="Select user"
            data={userOptions}
            value={selectedUserId !== null ? String(selectedUserId) : null}
            onChange={(val) => setSelectedUserId(val ? parseInt(val, 10) : null)}
            searchable
            clearable
            w={320}
          />
          <MultiSelect
            label="Data tables"
            placeholder="Select one or more data tables"
            data={[{ value: String(-1), label: 'All data tables' }, ...tableOptions]}
            value={selectedTableIds.map(String)}
            onChange={(vals) => {
              const parsed = vals.map((v) => parseInt(v, 10));
              // If -1 (All) is chosen, keep only -1
              setSelectedTableIds(parsed.includes(-1) ? [-1] : parsed);
            }}
            searchable
            clearable
            w={420}
          />
          <Checkbox
            label="Show deleted rows"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.currentTarget.checked)}
          />
          <Button leftSection={<IconDatabaseSearch size={16} />} onClick={handleSearch}>
            Search
          </Button>
        </Group>
      </Card>

      <DataTablesViewer
        activeTableIds={activeTableIds}
        selectedUserId={activeSelectedUserId}
        showDeleted={activeShowDeleted}
      />
    </Stack>
  );
}


