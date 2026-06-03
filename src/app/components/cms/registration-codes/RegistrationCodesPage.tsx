/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type OnChangeFn,
} from '@tanstack/react-table';
import {
    Table,
    TableTbody,
    TableTd,
    TableThead,
    TableTh,
    TableTr,
} from '@mantine/core';
import {
    Stack,
    Card,
    Group,
    Button,
    Text,
    Badge,
    ActionIcon,
    LoadingOverlay,
    TextInput,
    NumberInput,
    Select,
    Pagination,
    Box,
} from '@mantine/core';
import {
    IconSearch,
    IconX,
    IconSortAscending,
    IconSortDescending,
    IconDownload,
    IconSparkles,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useRegistrationCodes, useExportRegistrationCodes, useGenerateRegistrationCodes } from '../../../../hooks/useRegistrationCodes';
import { useGroups } from '../../../../hooks/useGroups';
import { useAuth } from '../../../../hooks/useAuth';
import { useCanReadRegistrationCodes, useCanCreateRegistrationCodes } from '../../../../hooks/usePermissionChecks';
import { ROUTES } from '../../../../config/routes.config';
import { PageHeader } from '../../shared/common/PageHeader';
import { EmptyState } from '../../shared/common/EmptyState';
import { FilterActions } from '../../shared/common/FilterControls';
import { ModalWrapper } from '../../shared/common/CustomModal/CustomModal';
import type { IRegistrationCode, IRegistrationCodesListParams } from '../../../../types/responses/admin/registration-codes.types';

/**
 * Registration-code timestamps arrive from the backend as UTC "Y-m-d H:i:s".
 * Render them in a fixed locale + UTC zone so server and client produce
 * identical text (no hydration mismatch, no browser-locale/timezone drift).
 */
function formatTimestamp(value: string | null): string {
    if (!value) return '';
    const iso = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        hour12: false,
    }) + ' UTC';
}

const DEFAULT_PARAMS: IRegistrationCodesListParams = {
    page: 1,
    pageSize: 20,
    search: '',
    id_groups: undefined,
    status: undefined,
    sort: 'created_at',
    sortDirection: 'desc',
};

export function RegistrationCodesPage() {
    const router = useRouter();
    const { isLoading: isAuthLoading } = useAuth();
    const canReadRegistrationCodes = useCanReadRegistrationCodes();
    const canCreateRegistrationCodes = useCanCreateRegistrationCodes();

    const { data: groupsData } = useGroups({ page: 1, pageSize: 1000 });
    const exportCodes = useExportRegistrationCodes();
    const generateCodes = useGenerateRegistrationCodes();

    // Filter form state (what user is editing)
    const [filterParams, setFilterParams] = useState<IRegistrationCodesListParams>(DEFAULT_PARAMS);

    // Applied params (what is sent to the API)
    const [params, setParams] = useState<IRegistrationCodesListParams>(DEFAULT_PARAMS);

    const { data, isFetching, error, refetch } = useRegistrationCodes(params);

    const generateMin = data?.config?.generate_min ?? 1;
    const generateMax = data?.config?.generate_max ?? 10000;

    const [generateModalOpened, setGenerateModalOpened] = useState(false);
    const [generateCount, setGenerateCount] = useState(generateMin);
    const [generateGroupId, setGenerateGroupId] = useState<string | null>(null);

    // Table sorting state
    const [sorting, setSorting] = useState<SortingState>([
        { id: DEFAULT_PARAMS.sort!, desc: DEFAULT_PARAMS.sortDirection === 'desc' },
    ]);

    const groupOptions = (groupsData?.groups ?? []).map(g => ({
        value: String(g.id),
        label: g.name,
    }));

    // Redirect if no read permission
    useEffect(() => {
        if (!isAuthLoading && !canReadRegistrationCodes) {
            router.push(ROUTES.NO_ACCESS);
        }
    }, [isAuthLoading, canReadRegistrationCodes, router]);

    // Handle sorting change — applied immediately like users
    const handleSortingChange = useCallback<OnChangeFn<SortingState>>((updaterOrValue) => {
        const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;
        setSorting(newSorting);
        if (newSorting.length > 0) {
            const s = newSorting[0];
            setParams(prev => ({
                ...prev,
                sort: s.id as IRegistrationCodesListParams['sort'],
                sortDirection: s.desc ? 'desc' : 'asc',
                page: 1,
            }));
        }
    }, [sorting]);

    const handleSearch = useCallback((search: string) => {
        setFilterParams(prev => ({ ...prev, search, page: 1 }));
    }, []);

    const handleClearSearch = useCallback(() => {
        setFilterParams(prev => ({ ...prev, search: '', page: 1 }));
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setParams(prev => ({ ...prev, page }));
    }, []);

    const handlePageSizeChange = useCallback((pageSize: string | null) => {
        if (pageSize) {
            setFilterParams(prev => ({ ...prev, pageSize: parseInt(pageSize, 10), page: 1 }));
        }
    }, []);

    const handleApplyFilters = useCallback(() => {
        setParams({ ...filterParams, page: 1 });
    }, [filterParams]);

    const handleResetFilters = useCallback(() => {
        setFilterParams(DEFAULT_PARAMS);
        setParams(DEFAULT_PARAMS);
    }, []);

    const handleExportCsv = useCallback(() => {
        exportCodes.mutate(
            { search: params.search, id_groups: params.id_groups, status: params.status },
            {
                onSuccess: (csv) => {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
                    const filename = `registration_codes_${timestamp}.csv`;
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    notifications.show({ title: 'Export Successful', message: `"${filename}" downloaded`, color: 'green' });
                },
            }
        );
    }, [exportCodes, params.search, params.id_groups, params.status]);

    const handleCloseGenerate = useCallback(() => {
        setGenerateModalOpened(false);
        setGenerateCount(generateMin);
        setGenerateGroupId(null);
    }, []);

    const handleGenerate = useCallback(() => {
        if (!generateGroupId) return;
        generateCodes.mutate(
            {
                count: generateCount,
                id_groups: Number(generateGroupId),
            },
            { onSuccess: handleCloseGenerate }
        );
    }, [generateCodes, generateCount, generateGroupId, handleCloseGenerate]);

    const columns = useMemo<ColumnDef<IRegistrationCode>[]>(() => [
        {
            accessorKey: 'code',
            header: 'Code',
            cell: ({ row }) => (
                <Text size="sm" ff="monospace" fw={500}>{row.original.code}</Text>
            ),
        },
        {
            accessorKey: 'group_name',
            header: 'Group',
            cell: ({ row }) => (
                <Badge variant="light" color="blue">{row.original.group_name}</Badge>
            ),
        },
        {
            accessorKey: 'is_consumed',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="light" color={row.original.is_consumed ? 'gray' : 'green'}>
                    {row.original.is_consumed ? 'Used' : 'Available'}
                </Badge>
            ),
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => (
                <Group gap="xs">
                    <Text fw={500}>Created</Text>
                    <ActionIcon variant="transparent" size="xs" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {column.getIsSorted() === 'asc' ? <IconSortAscending size={14} /> : column.getIsSorted() === 'desc' ? <IconSortDescending size={14} /> : <IconSortAscending size={14} opacity={0.5} />}
                    </ActionIcon>
                </Group>
            ),
            cell: ({ row }) => (
                <Text size="sm" c="dimmed">{formatTimestamp(row.original.created_at)}</Text>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'consumed_at',
            header: ({ column }) => (
                <Group gap="xs">
                    <Text fw={500}>Consumed</Text>
                    <ActionIcon variant="transparent" size="xs" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {column.getIsSorted() === 'asc' ? <IconSortAscending size={14} /> : column.getIsSorted() === 'desc' ? <IconSortDescending size={14} /> : <IconSortAscending size={14} opacity={0.5} />}
                    </ActionIcon>
                </Group>
            ),
            cell: ({ row }) => (
                row.original.consumed_at
                    ? <Text size="sm" c="dimmed">{formatTimestamp(row.original.consumed_at)}</Text>
                    : null
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'user_email',
            header: 'Registered User',
            cell: ({ row }) => (
                row.original.user_email
                    ? <Text size="sm">{row.original.user_email}</Text>
                    : <Text size="sm" c="dimmed">—</Text>
            ),
        },
    ], []);

    const table = useReactTable({
        data: data?.codes ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualSorting: true,
        manualPagination: true,
        state: { sorting },
        onSortingChange: handleSortingChange,
        enableSortingRemoval: false,
    });

    if (isAuthLoading) {
        return null;
    }

    if (!canReadRegistrationCodes) {
        return null;
    }

    if (error) {
        return (
            <Card>
                <Text c="red" ta="center">Failed to load registration codes. Please try again.</Text>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <Stack gap="md">
                    <PageHeader
                        title="Registration Codes"
                        subtitle="Manage invitation codes required for user registration when open registration is disabled"
                    >
                        {canReadRegistrationCodes && (
                            <Button
                                variant="light"
                                leftSection={<IconDownload size={16} />}
                                onClick={handleExportCsv}
                                loading={exportCodes.isPending}
                            >
                                Export CSV
                            </Button>
                        )}
                        {canCreateRegistrationCodes && (
                            <Button
                                leftSection={<IconSparkles size={16} />}
                                onClick={() => setGenerateModalOpened(true)}
                            >
                                Generate Codes
                            </Button>
                        )}
                    </PageHeader>

                    {/* Filters */}
                    <Card withBorder p="md">
                        <Group gap="md" align="flex-end" justify="space-between">
                            <Group gap="md" style={{ flex: 1 }}>
                                <TextInput
                                    placeholder="Search codes..."
                                    leftSection={<IconSearch size={16} />}
                                    rightSection={
                                        filterParams.search ? (
                                            <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleClearSearch}>
                                                <IconX size={14} />
                                            </ActionIcon>
                                        ) : null
                                    }
                                    value={filterParams.search ?? ''}
                                    onChange={e => handleSearch(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                />
                                <Select
                                    placeholder="Filter by group"
                                    data={groupOptions}
                                    value={filterParams.id_groups ? String(filterParams.id_groups) : null}
                                    onChange={v => setFilterParams(p => ({ ...p, id_groups: v ? Number(v) : undefined, page: 1 }))}
                                    clearable
                                    searchable
                                    w={180}
                                />
                                <Select
                                    placeholder="Filter by status"
                                    data={[
                                        { value: 'available', label: 'Available' },
                                        { value: 'used', label: 'Used' },
                                    ]}
                                    value={filterParams.status ?? null}
                                    onChange={v => setFilterParams(p => ({ ...p, status: (v as IRegistrationCodesListParams['status']) ?? undefined, page: 1 }))}
                                    clearable
                                    w={150}
                                />
                                <Select
                                    placeholder="Per page"
                                    value={filterParams.pageSize?.toString() ?? '20'}
                                    onChange={handlePageSizeChange}
                                    data={[
                                        { value: '10', label: '10' },
                                        { value: '20', label: '20' },
                                        { value: '50', label: '50' },
                                        { value: '100', label: '100' },
                                    ]}
                                    w={100}
                                />
                            </Group>
                            <Group justify="flex-end">
                                <FilterActions
                                    onApply={handleApplyFilters}
                                    onReset={handleResetFilters}
                                    onRefresh={refetch}
                                    isFetching={isFetching}
                                    isApplyDisabled={filterParams === params}
                                />
                            </Group>
                        </Group>
                    </Card>

                    {/* Table */}
                    <div style={{ position: 'relative' }}>
                        <LoadingOverlay visible={isFetching} />

                        <Box style={{ overflowX: 'auto' }}>
                            <Table striped highlightOnHover>
                                <TableThead>
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <TableTr key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <TableTh key={header.id}>
                                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableTh>
                                            ))}
                                        </TableTr>
                                    ))}
                                </TableThead>
                                <TableTbody>
                                    {table.getRowModel().rows.map(row => (
                                        <TableTr key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <TableTd key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableTd>
                                            ))}
                                        </TableTr>
                                    ))}
                                </TableTbody>
                            </Table>
                        </Box>

                        {!isFetching && (!data?.codes || data.codes.length === 0) && (
                            <EmptyState
                                title="No registration codes"
                                description={
                                    params.search || params.id_groups || params.status
                                        ? 'Try adjusting your filters'
                                        : 'Generate codes to allow users to register with an invitation'
                                }
                            />
                        )}
                    </div>

                    {/* Pagination */}
                    {data?.pagination && data.pagination.totalPages > 1 && (
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">
                                Showing {(data.pagination.page - 1) * data.pagination.pageSize + 1} to{' '}
                                {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalCount)} of{' '}
                                {data.pagination.totalCount} codes
                            </Text>
                            <Pagination
                                value={data.pagination.page}
                                onChange={handlePageChange}
                                total={data.pagination.totalPages}
                                size="sm"
                            />
                        </Group>
                    )}
                </Stack>
            </Card>

            {/* Generate codes modal */}
            <ModalWrapper
                opened={generateModalOpened}
                onClose={handleCloseGenerate}
                title="Generate Registration Codes"
                size="sm"
                onSave={handleGenerate}
                onCancel={handleCloseGenerate}
                saveLabel={`Generate ${generateCount} code${generateCount !== 1 ? 's' : ''}`}
                isLoading={generateCodes.isPending}
                disabled={!generateGroupId || generateCount < 1}
            >
                <Stack gap="md">
                    <NumberInput
                        label="Number of codes"
                        description={`How many codes to generate (max ${generateMax.toLocaleString()}) in a single request`}
                        value={generateCount}
                        onChange={(v) => setGenerateCount(typeof v === 'number' ? v : generateMin)}
                        min={generateMin}
                        max={generateMax}
                        required
                    />
                    <Select
                        label="Group"
                        placeholder="Select a group"
                        data={groupOptions}
                        value={generateGroupId}
                        onChange={setGenerateGroupId}
                        searchable
                        required
                    />
                </Stack>
            </ModalWrapper>

        </>
    );
}
