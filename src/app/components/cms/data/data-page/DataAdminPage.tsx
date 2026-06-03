/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Group,
  MultiSelect,
  Select,
  Stack,
  Paper,
} from '@mantine/core';
import { IconAlertCircle, IconPackageExport } from '@tabler/icons-react';
import { useDataTables } from '../../../../../hooks/useData';
import { useCanAccessDataBrowser } from '../../../../../hooks/usePermissionChecks';
import { useUsers } from '../../../../../hooks/useUsers';
import { usePublicLanguages } from '../../../../../hooks/useLanguages';
import type { IUserBasic } from '../../../../../types/responses/admin/users.types';
import { DataTablesViewer } from '../tables/DataTablesViewer';
import { BulkExportModal } from '../modals/BulkExportModal';
import { FilterActions } from '../../../shared/common/FilterControls';
import { PageHeader } from '../../../shared/common/PageHeader';

const ALL_TABLES = -1;

/**
 * Resolve the next data-table selection. "All data tables" (`-1`) is a shortcut
 * that is mutually exclusive with specific tables:
 *  - newly adding "all" collapses the selection to just `[-1]`;
 *  - picking a specific table while "all" was active switches to that table
 *    (drops `-1`), instead of staying stuck on "all";
 *  - otherwise the raw selection is used as-is.
 */
export function resolveTableSelection(next: number[], previous: number[]): number[] {
  const addingAll = next.includes(ALL_TABLES);
  if (addingAll && previous.includes(ALL_TABLES)) {
    // "all" was already selected and the user picked a specific table.
    return next.filter((v) => v !== ALL_TABLES);
  }
  if (addingAll) return [ALL_TABLES];
  return next;
}

export function DataAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canAccessDataBrowser = useCanAccessDataBrowser();

  // Filter form state (what user is currently selecting)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(() => {
    const userId = searchParams.get('userId');
    return userId ? parseInt(userId, 10) : -1;
  });

  const [selectedTableIds, setSelectedTableIds] = useState<number[]>(() => {
    const tableIds = searchParams.get('tableIds');
    return tableIds
      ? tableIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      : [];
  });

  const [showDeleted, setShowDeleted] = useState<boolean>(() =>
    searchParams.get('showDeleted') === 'true'
  );

  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(() => {
    const languageId = searchParams.get('languageId');
    return languageId ? parseInt(languageId, 10) : 1;
  });

  const [bulkExportOpen, setBulkExportOpen] = useState(false);

  // Active (applied) filters
  const [activeSelectedUserId, setActiveSelectedUserId] = useState<number>(-1);
  const [activeTableIds, setActiveTableIds] = useState<number[]>([]);
  const [activeShowDeleted, setActiveShowDeleted] = useState<boolean>(false);
  const [activeSelectedLanguageId, setActiveSelectedLanguageId] = useState<number>(1);

  // Data fetching
  const { data: usersResp, refetch: refetchUsers } = useUsers({ page: 1, pageSize: 100, sort: 'email', sortDirection: 'asc' });
  const { data: tablesResp, refetch: refetchTables, isFetching: isTablesFetching } = useDataTables();
  const { languages, refetch: refetchLanguages } = usePublicLanguages();

  const userOptions = useMemo(() => {
    const users: IUserBasic[] = usersResp?.users || [];
    return [
      { value: String(-1), label: 'All users' },
      ...users.map((u) => ({ value: String(u.id), label: u.email })),
    ];
  }, [usersResp]);

  const tableOptions = useMemo(() => {
    const tables = tablesResp?.dataTables || [];
    return tables.map((t) => ({
      value: String(t.id),
      label: t.displayName || t.name,
    }));
  }, [tablesResp]);

  const languageOptions = useMemo(() => {
    return languages.map((lang) => ({
      value: String(lang.id),
      label: `${lang.language} (${lang.locale})`,
    }));
  }, [languages]);

  const hasTables = tableOptions.length > 0;

  // Apply Filters (Search button)
  const handleApplyFilters = useCallback(() => {
    const userId = selectedUserId ?? -1;
    const languageId = selectedLanguageId ?? 1;
    const tableIds = selectedTableIds.includes(-1) ? [-1] : [...selectedTableIds];

    setActiveSelectedUserId(userId);
    setActiveShowDeleted(showDeleted);
    setActiveSelectedLanguageId(languageId);
    setActiveTableIds(tableIds);

    // Update URL
    const url = new URL(window.location.href);
    const sp = new URLSearchParams(url.search);

    if (userId !== -1) sp.set('userId', userId.toString());
    else sp.delete('userId');

    if (tableIds.length > 0 && !tableIds.includes(-1)) sp.set('tableIds', tableIds.join(','));
    else sp.delete('tableIds');

    if (showDeleted) sp.set('showDeleted', 'true');
    else sp.delete('showDeleted');

    if (languageId !== 1) sp.set('languageId', languageId.toString());
    else sp.delete('languageId');

    router.replace(`${url.pathname}?${sp.toString()}`, { scroll: false });
  }, [selectedUserId, selectedTableIds, showDeleted, selectedLanguageId, router]);

  // Reset Filters
  const handleResetFilters = useCallback(() => {
    setSelectedUserId(-1);
    setSelectedTableIds([]);
    setShowDeleted(false);
    setSelectedLanguageId(1);

    setActiveSelectedUserId(-1);
    setActiveTableIds([]);
    setActiveShowDeleted(false);
    setActiveSelectedLanguageId(1);

    const currentPath = globalThis.location.pathname;
    router.replace(currentPath, { scroll: false });
  }, [router]);

    // Refresh
    const handleRefresh = useCallback(() => {
    refetchUsers();
    refetchTables();
    refetchLanguages();
  }, [refetchUsers, refetchTables, refetchLanguages]);

  return (
    <Paper p="md" radius="md">
      <Stack gap="md">
        {/* Standardized Header */}
        <PageHeader
          title="Data Management"
          subtitle="Explore and manage form data across users and tables"
        >
          <Button
            variant="light"
            leftSection={<IconPackageExport size={16} />}
            onClick={() => setBulkExportOpen(true)}
            disabled={!hasTables}
          >
            Export tables
          </Button>
        </PageHeader>

        {!canAccessDataBrowser && (
          <Alert variant="light" color="orange" title="No Access to Data Tables" icon={<IconAlertCircle />}>
            You currently have no access to any data tables. Please contact your administrator.
          </Alert>
        )}

        {/* Filters Card */}
        <Card withBorder>
          <Stack gap="md">
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

              <Select
                label="Language"
                placeholder="Select language"
                data={languageOptions}
                value={selectedLanguageId !== null ? String(selectedLanguageId) : null}
                onChange={(val) => setSelectedLanguageId(val ? parseInt(val, 10) : null)}
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
                  const parsed = vals.map(v => parseInt(v, 10));
                  setSelectedTableIds(resolveTableSelection(parsed, selectedTableIds));
                }}
                searchable
                clearable
                w={420}
                disabled={!hasTables}
              />

              <Checkbox
                label="Show deleted rows"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.currentTarget.checked)}
                mt={24}
              />
            </Group>

            {/* Reusable FilterActions */}
            <FilterActions
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              onRefresh={handleRefresh}
              isFetching={isTablesFetching}
              isApplyDisabled={false}
            />
          </Stack>
        </Card>

        {/* Data Viewer */}
        <DataTablesViewer
          activeTableIds={activeTableIds}
          selectedUserId={activeSelectedUserId}
          showDeleted={activeShowDeleted}
          selectedLanguageId={activeSelectedLanguageId}
        />
      </Stack>

      <BulkExportModal
        open={bulkExportOpen}
        onClose={() => setBulkExportOpen(false)}
        tables={tablesResp?.dataTables || []}
      />
    </Paper>
  );
}