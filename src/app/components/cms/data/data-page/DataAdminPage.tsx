"use client";

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Card, Checkbox, Group, MultiSelect, Select, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle, IconDatabaseSearch, IconSettings } from '@tabler/icons-react';
import { useDataTables } from '../../../../../hooks/useData';
import { useUsers } from '../../../../../hooks/useUsers';
import { usePublicLanguages } from '../../../../../hooks/useLanguages';
import type { IUserBasic } from '../../../../../types/responses/admin/users.types';
import { DataTablesViewer } from '../tables/DataTablesViewer';

export function DataAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const [selectedUserId, setSelectedUserId] = useState<number | null>(() => {
    const userId = searchParams.get('userId');
    return userId ? parseInt(userId, 10) : -1;
  });
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>(() => {
    const tableIds = searchParams.get('tableIds');
    return tableIds ? tableIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];
  });
  const [activeTableIds, setActiveTableIds] = useState<number[]>([]);
  const [showDeleted, setShowDeleted] = useState<boolean>(() => {
    return searchParams.get('showDeleted') === 'true';
  });
  const [activeSelectedUserId, setActiveSelectedUserId] = useState<number>(-1);
  const [activeShowDeleted, setActiveShowDeleted] = useState<boolean>(false);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(() => {
    const languageId = searchParams.get('languageId');
    return languageId ? parseInt(languageId, 10) : 1; // Default to 1 (internal)
  });
  const [activeSelectedLanguageId, setActiveSelectedLanguageId] = useState<number>(1);

  // Users - fetch reasonable amount for dropdown, can be searched if needed
  const { data: usersResp } = useUsers({ page: 1, pageSize: 100, sort: 'email', sortDirection: 'asc' });
  const { data: tablesResp } = useDataTables();
  const { languages } = usePublicLanguages();

  const userOptions = useMemo(() => {
    const users: IUserBasic[] = usersResp?.users || [];
    const options = users.map((u) => ({ value: String(u.id), label: u.email }));
    return [{ value: String(-1), label: 'All users' }, ...options];
  }, [usersResp]);

  const tableOptions = useMemo(() => {
    const tables = tablesResp?.dataTables || [];
    return tables.map((t) => ({ value: String(t.id), label: t.displayName || t.name }));
  }, [tablesResp]);

  const hasTables = tableOptions.length > 0;

  const languageOptions = useMemo(() => {
    return languages.map((lang) => ({ value: String(lang.id), label: `${lang.language} (${lang.locale})` }));
  }, [languages]);

  // Update URL parameters when filter state changes
  const updateUrlParams = useCallback((params: {
    userId?: number | null;
    tableIds?: number[];
    showDeleted?: boolean;
    languageId?: number | null;
  }) => {
    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams(url.search);

    if (params.userId !== undefined && params.userId !== null && params.userId !== -1) {
      searchParams.set('userId', params.userId.toString());
    } else {
      searchParams.delete('userId');
    }

    if (params.tableIds !== undefined && params.tableIds.length > 0) {
      searchParams.set('tableIds', params.tableIds.join(','));
    } else {
      searchParams.delete('tableIds');
    }

    if (params.showDeleted !== undefined && params.showDeleted) {
      searchParams.set('showDeleted', 'true');
    } else {
      searchParams.delete('showDeleted');
    }

    if (params.languageId !== undefined && params.languageId !== null && params.languageId !== 1) {
      searchParams.set('languageId', params.languageId.toString());
    } else {
      searchParams.delete('languageId');
    }

    const newUrl = `${url.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [router]);

  const handleSearch = useCallback(() => {
    // Apply filters only when Search is pressed
    const userId = selectedUserId ?? -1;
    const languageId = selectedLanguageId ?? 1;
    const tableIds = selectedTableIds.includes(-1) ? [-1] : [...selectedTableIds];

    setActiveSelectedUserId(userId);
    setActiveShowDeleted(showDeleted);
    setActiveSelectedLanguageId(languageId);
    setActiveTableIds(tableIds);

    // Update URL with current filter state
    updateUrlParams({
      userId: userId !== -1 ? userId : undefined,
      tableIds: tableIds.length > 0 && !tableIds.includes(-1) ? tableIds : undefined,
      showDeleted: showDeleted || undefined,
      languageId: languageId !== 1 ? languageId : undefined,
    });
  }, [selectedTableIds, selectedUserId, showDeleted, selectedLanguageId, updateUrlParams]);

  // Auto-search when URL contains parameters on page load
  useEffect(() => {
    const hasUrlParams = searchParams.get('userId') || searchParams.get('tableIds') || searchParams.get('showDeleted') || searchParams.get('languageId');
    if (hasUrlParams && activeTableIds.length === 0) {
      // Only auto-search if we haven't applied filters yet
      handleSearch();
    }
  }, []); // Empty dependency array - only run once on mount

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

      {!hasTables && (
        <Alert variant="light" color="orange" title="No Access to Data Tables" icon={<IconAlertCircle />}>
          You currently have no access to any data tables. Please contact your administrator to request access.
        </Alert>
      )}

      <Card>
        <Group align="end" gap="md">
          <Select
            label="User"
            placeholder="Select user"
            data={userOptions}
            value={selectedUserId !== null ? String(selectedUserId) : null}
            onChange={(val) => {
              const newValue = val ? parseInt(val, 10) : null;
              setSelectedUserId(newValue);
              updateUrlParams({ userId: newValue });
            }}
            searchable
            clearable
            w={320}
          />
          <Select
            label="Language"
            placeholder="Select language"
            data={languageOptions}
            value={selectedLanguageId !== null ? String(selectedLanguageId) : null}
            onChange={(val) => {
              const newValue = val ? parseInt(val, 10) : null;
              setSelectedLanguageId(newValue);
              updateUrlParams({ languageId: newValue });
            }}
            searchable
            clearable
            w={200}
          />
          <MultiSelect
            label="Data tables"
            placeholder="Select one or more data tables"
            data={hasTables ? [{ value: String(-1), label: 'All data tables' }, ...tableOptions] : []}
            value={selectedTableIds.map(String)}
            onChange={(vals) => {
              const parsed = vals.map((v) => parseInt(v, 10));
              // If -1 (All) is chosen, keep only -1
              const newTableIds = parsed.includes(-1) ? [-1] : parsed;
              setSelectedTableIds(newTableIds);
              updateUrlParams({ tableIds: newTableIds });
            }}
            searchable
            clearable
            w={420}
            disabled={!hasTables}
          />
          <Checkbox
            label="Show deleted rows"
            checked={showDeleted}
            onChange={(e) => {
              const newValue = e.currentTarget.checked;
              setShowDeleted(newValue);
              updateUrlParams({ showDeleted: newValue });
            }}
          />
          <Button leftSection={<IconDatabaseSearch size={16} />} onClick={handleSearch} disabled={!hasTables}>
            Search
          </Button>
        </Group>
      </Card>

      <DataTablesViewer
        activeTableIds={activeTableIds}
        selectedUserId={activeSelectedUserId}
        showDeleted={activeShowDeleted}
        selectedLanguageId={activeSelectedLanguageId}
      />
    </Stack>
  );
}


