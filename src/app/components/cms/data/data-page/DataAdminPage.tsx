/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { useDataTables, DATA_QUERY_KEYS } from '../../../../../hooks/useData';
import { useCanAccessDataBrowser } from '../../../../../hooks/usePermissionChecks';
import { useUsers } from '../../../../../hooks/useUsers';
import { usePublicLanguages } from '../../../../../hooks/useLanguages';
import { useCmsPreferences } from '../../../../../hooks/usePreferences';
import type { IUserBasic } from '../../../../../types/responses/admin/users.types';
import { DataTablesViewer } from '../tables/DataTablesViewer';
import { BulkExportModal } from '../modals/BulkExportModal';
import { FilterActions } from '../../../shared/common/FilterControls';
import { PageHeader } from '../../../shared/common/PageHeader';
import {
  readLanguageIdFromSearchParams,
  resolveDataAdminLanguageId,
  shouldPersistLanguageIdInUrl,
} from './data-admin-language.utils';

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
  const queryClient = useQueryClient();
  const urlLanguageId = useMemo(
    () => readLanguageIdFromSearchParams(searchParams),
    [searchParams],
  );
  const { data: cmsPreferences } = useCmsPreferences();
  const cmsDefaultLanguageId = resolveDataAdminLanguageId(undefined, cmsPreferences?.default_language_id);

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

  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(urlLanguageId);

  const [bulkExportOpen, setBulkExportOpen] = useState(false);

  // Defer the (up to 100) user-list fetch — it only fills the "User" filter
  // dropdown and otherwise runs on every page open. Load it on first dropdown
  // interaction, or eagerly when a `?userId=` deep link needs the label.
  const [shouldLoadUsers, setShouldLoadUsers] = useState<boolean>(
    () => searchParams.get('userId') !== null
  );

  // Active (applied) filters — initialized from URL so deep links work without
  // requiring an extra "Apply filters" click on first load.
  const [activeSelectedUserId, setActiveSelectedUserId] = useState<number>(() => {
    const userId = searchParams.get('userId');
    return userId ? parseInt(userId, 10) : -1;
  });
  const [activeTableIds, setActiveTableIds] = useState<number[]>(() => {
    const tableIds = searchParams.get('tableIds');
    return tableIds
      ? tableIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      : [];
  });
  const [activeShowDeleted, setActiveShowDeleted] = useState<boolean>(() =>
    searchParams.get('showDeleted') === 'true'
  );
  const [activeSelectedLanguageId, setActiveSelectedLanguageId] = useState<number | null>(urlLanguageId);

  // Pre-fill the Language dropdown with CMS default when no URL param (display only;
  // bio/option labels resolve the same default via resolveDataAdminLanguageId).
  const displayedLanguageId = useMemo(() => {
    if (selectedLanguageId !== null) {
      return selectedLanguageId;
    }
    if (urlLanguageId !== null) {
      return urlLanguageId;
    }
    return cmsPreferences ? cmsDefaultLanguageId : null;
  }, [selectedLanguageId, urlLanguageId, cmsPreferences, cmsDefaultLanguageId]);

  // Data fetching
  const { data: usersResp, refetch: refetchUsers } = useUsers(
    { page: 1, pageSize: 100, sort: 'email', sortDirection: 'asc' },
    { enabled: shouldLoadUsers }
  );
  const { data: tablesResp, isFetching: isTablesFetching } = useDataTables();
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

  // Drop selected table ids that no longer exist (e.g. the table was deleted, or
  // a `?tableIds=` deep link points at a since-deleted table) so the picker
  // doesn't keep a phantom chip. Render-phase reconcile — same pattern as
  // DataTablesViewer — keyed on the fetched id list; runs once the tables query
  // has settled (null sentinel) and again whenever that list changes, including
  // when it becomes empty. `-1` ("all") is always kept.
  const validTableIdsKey = useMemo(
    () => (tablesResp ? (tablesResp.dataTables || []).map((t) => t.id).join(',') : null),
    [tablesResp],
  );
  const [prevValidTableIdsKey, setPrevValidTableIdsKey] = useState<string | null>(null);
  if (validTableIdsKey !== null && prevValidTableIdsKey !== validTableIdsKey) {
    setPrevValidTableIdsKey(validTableIdsKey);
    const validIds = new Set((tablesResp?.dataTables || []).map((t) => t.id));
    const prune = (ids: number[]) => ids.filter((id) => id === ALL_TABLES || validIds.has(id));
    setSelectedTableIds((prev) => {
      const next = prune(prev);
      return next.length === prev.length ? prev : next;
    });
    setActiveTableIds((prev) => {
      const next = prune(prev);
      return next.length === prev.length ? prev : next;
    });
  }

  // Also strip since-deleted ids from the `?tableIds=` URL param so a reload
  // doesn't reintroduce the phantom chip. Runs once the tables query settles.
  useEffect(() => {
    if (!tablesResp) return;
    const raw = searchParams.get('tableIds');
    if (!raw) return;
    const validIds = new Set((tablesResp.dataTables || []).map((t) => t.id));
    const current = raw.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    const kept = current.filter((id) => id === ALL_TABLES || validIds.has(id));
    if (kept.length === current.length) return; // nothing stale
    const url = new URL(window.location.href);
    if (kept.length > 0 && !kept.includes(ALL_TABLES)) url.searchParams.set('tableIds', kept.join(','));
    else url.searchParams.delete('tableIds');
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }, [tablesResp, searchParams, router]);

  // Apply Filters (Search button)
  const handleApplyFilters = useCallback(() => {
    const userId = selectedUserId ?? -1;
    const languageId = resolveDataAdminLanguageId(selectedLanguageId, cmsPreferences?.default_language_id);
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

    if (shouldPersistLanguageIdInUrl(languageId, cmsDefaultLanguageId)) {
      sp.set('languageId', languageId.toString());
    } else {
      sp.delete('languageId');
    }

    router.replace(`${url.pathname}?${sp.toString()}`, { scroll: false });
  }, [selectedUserId, selectedTableIds, showDeleted, selectedLanguageId, cmsPreferences?.default_language_id, cmsDefaultLanguageId, router]);

  // Reset Filters
  const handleResetFilters = useCallback(() => {
    setSelectedUserId(-1);
    setSelectedTableIds([]);
    setShowDeleted(false);
    setSelectedLanguageId(cmsDefaultLanguageId);

    setActiveSelectedUserId(-1);
    setActiveTableIds([]);
    setActiveShowDeleted(false);
    setActiveSelectedLanguageId(cmsDefaultLanguageId);

    const currentPath = globalThis.location.pathname;
    router.replace(currentPath, { scroll: false });
  }, [router, cmsDefaultLanguageId]);

  // Refresh. The actual rows + column labels live in <SingleDataTable> under
  // DATA_QUERY_KEYS.all (one query per expanded table), so refetching only the
  // table list here used to miss new submissions. Invalidating the whole
  // `admin/data` cache refreshes the table list and every expanded table at
  // once; keepPreviousData + the per-table overlay keep it smooth (no full
  // component reload).
  const handleRefresh = useCallback(() => {
    setShouldLoadUsers(true);
    void refetchUsers();
    void refetchLanguages();
    void queryClient.invalidateQueries({ queryKey: DATA_QUERY_KEYS.all });
  }, [refetchUsers, refetchLanguages, queryClient]);

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
                onDropdownOpen={() => setShouldLoadUsers(true)}
                searchable
                clearable
                w={320}
              />

              <Select
                label="Language"
                placeholder="Select language"
                data={languageOptions}
                value={displayedLanguageId !== null ? String(displayedLanguageId) : null}
                onChange={(val) => setSelectedLanguageId(val ? parseInt(val, 10) : null)}
                searchable
                clearable
                w={200}
              />

              <MultiSelect
                label="Data tables"
                placeholder={hasTables ? 'Select one or more data tables' : 'No data tables yet'}
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
          selectedLanguageId={resolveDataAdminLanguageId(activeSelectedLanguageId, cmsPreferences?.default_language_id)}
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