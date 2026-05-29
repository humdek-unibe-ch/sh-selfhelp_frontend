/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, useMemo, useCallback } from 'react';
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
    Tooltip,
    LoadingOverlay,
    Modal,
    TextInput,
    Select,
    Pagination,
    Box,
} from '@mantine/core';
import {
    IconPlus,
    IconTrash,
    IconSearch,
    IconX,
    IconSortAscending,
    IconSortDescending,
    IconRefresh,
} from '@tabler/icons-react';
import { useRegistrationCodes, useCreateRegistrationCode, useDeleteRegistrationCode } from '../../../../hooks/useRegistrationCodes';
import { useGroups } from '../../../../hooks/useGroups';
import { PageHeader } from '../../shared/common/PageHeader';
import { EmptyState } from '../../shared/common/EmptyState';
import { FilterActions } from '../../shared/common/FilterControls';
import type { IRegistrationCode, IRegistrationCodesListParams } from '../../../../types/responses/admin/registration-codes.types';

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
    const { data: groupsData } = useGroups({ page: 1, pageSize: 1000 });
    const createCode = useCreateRegistrationCode();
    const deleteCode = useDeleteRegistrationCode();

    // Filter form state (what user is editing)
    const [filterParams, setFilterParams] = useState<IRegistrationCodesListParams>(DEFAULT_PARAMS);

    // Applied params (what is sent to the API)
    const [params, setParams] = useState<IRegistrationCodesListParams>(DEFAULT_PARAMS);

    const { data, isFetching, error, refetch } = useRegistrationCodes(params);

    const [createModalOpened, setCreateModalOpened] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<IRegistrationCode | null>(null);
    const [newCode, setNewCode] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Table sorting state
    const [sorting, setSorting] = useState<SortingState>([
        { id: DEFAULT_PARAMS.sort!, desc: DEFAULT_PARAMS.sortDirection === 'desc' },
    ]);

    const groupOptions = (groupsData?.groups ?? []).map(g => ({
        value: String(g.id),
        label: g.name,
    }));

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

    const handleCreate = () => {
        if (!newCode.trim() || !selectedGroupId) return;
        createCode.mutate(
            { code: newCode.trim(), id_groups: Number(selectedGroupId) },
            {
                onSuccess: () => {
                    setCreateModalOpened(false);
                    setNewCode('');
                    setSelectedGroupId(null);
                },
            }
        );
    };

    const handleCloseCreate = () => {
        setCreateModalOpened(false);
        setNewCode('');
        setSelectedGroupId(null);
    };

    const handleGenerateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setNewCode(code);
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        deleteCode.mutate(deleteTarget.code, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

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
                <Text size="sm" c="dimmed">{new Date(row.original.created_at).toLocaleString()}</Text>
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
                    ? <Text size="sm" c="dimmed">{new Date(row.original.consumed_at).toLocaleString()}</Text>
                    : null
            ),
            enableSorting: true,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Tooltip label="Delete code">
                    <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => setDeleteTarget(row.original)}
                        aria-label={`Delete code ${row.original.code}`}
                    >
                        <IconTrash size={16} />
                    </ActionIcon>
                </Tooltip>
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
                        subtitle="Manage invitation codes required for user registration"
                    >
                        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateModalOpened(true)}>
                            Add Code
                        </Button>
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
                                        : 'Add a code to allow users to register with an invitation'
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

            {/* Create modal */}
            <Modal opened={createModalOpened} onClose={handleCloseCreate} title="Add Registration Code" centered size="sm">
                <Stack gap="md">
                    <TextInput
                        label="Code"
                        placeholder="Enter invitation code (max 16 chars)"
                        value={newCode}
                        onChange={e => setNewCode(e.currentTarget.value)}
                        maxLength={16}
                        required
                        rightSection={
                            <Tooltip label="Generate random code">
                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleGenerateCode} aria-label="Generate random code">
                                    <IconRefresh size={14} />
                                </ActionIcon>
                            </Tooltip>
                        }
                    />
                    <Select
                        label="Group"
                        placeholder="Select a group"
                        data={groupOptions}
                        value={selectedGroupId}
                        onChange={setSelectedGroupId}
                        searchable
                        required
                    />
                    <Group justify="flex-end" gap="sm">
                        <Button variant="light" onClick={handleCloseCreate}>Cancel</Button>
                        <Button onClick={handleCreate} loading={createCode.isPending} disabled={!newCode.trim() || !selectedGroupId}>
                            Create
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Delete confirmation modal */}
            <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Registration Code" centered size="sm">
                <Stack gap="md">
                    <Text size="sm">
                        Are you sure you want to delete the code{' '}
                        <Text component="span" ff="monospace" fw={600}>{deleteTarget?.code}</Text>?
                        This action cannot be undone.
                    </Text>
                    <Group justify="flex-end" gap="sm">
                        <Button variant="light" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button color="red" onClick={handleConfirmDelete} loading={deleteCode.isPending}>
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
