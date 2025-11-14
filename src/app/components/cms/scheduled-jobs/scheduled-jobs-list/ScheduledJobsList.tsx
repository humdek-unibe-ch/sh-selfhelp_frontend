"use client";

import React, { useState, useMemo, useCallback } from 'react';
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
  Card,
  Group,
  TextInput,
  Select,
  Pagination,
  Badge,
  ActionIcon,
  LoadingOverlay,
  Text,
  Stack,
  Button,
  Menu,
  Center,
  Box,
  Checkbox,
  Paper,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconSearch,
  IconEye,
  IconPlayerPlay,
  IconTrash,
  IconDots,
  IconFilter,
  IconRefresh,
  IconSortAscending,
  IconSortDescending,
  IconX,
  IconPlus,
  IconMinus,
} from '@tabler/icons-react';
import { useScheduledJobs } from '../../../../../hooks/useScheduledJobs';
import { useLookups } from '../../../../../hooks/useLookups';
import { getScheduledJobStatuses, getScheduledJobTypes, getScheduledJobSearchDateTypes } from '../../../../../utils/lookup-filters.utils';
import { IScheduledJobFilters, IScheduledJob, IScheduledJobTransaction } from '../../../../../types/responses/admin/scheduled-jobs.types';
import classes from './ScheduledJobsList.module.css';

interface IScheduledJobsListProps {
    onViewJob?: (jobId: number) => void;
    onExecuteJob?: (jobId: number) => void;
    onDeleteJob?: (jobId: number, description: string) => void;
    onBulkDeleteJobs?: (jobIds: number[], descriptions: string[]) => void;
}

export function ScheduledJobsList({
    onViewJob,
    onExecuteJob,
    onDeleteJob,
    onBulkDeleteJobs,
}: IScheduledJobsListProps) {
    // State for table parameters
    const [params, setParams] = useState<IScheduledJobFilters>({
        page: 1,
        pageSize: 20,
        dateType: 'date_to_be_executed',
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
    });

    const [showFilters, setShowFilters] = useState(false);
    const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Real API calls
    const { data: scheduledJobsData, isLoading, error, refetch } = useScheduledJobs(params);
    const { data: lookupsData, isLoading: lookupsLoading } = useLookups();

    // Process lookups for filters
    const statusOptions = lookupsData ? getScheduledJobStatuses(lookupsData.lookups) : [];
    const typeOptions = lookupsData ? getScheduledJobTypes(lookupsData.lookups) : [];
    const dateTypeOptions = lookupsData ? getScheduledJobSearchDateTypes(lookupsData.lookups) : [];



    const scheduledJobs = scheduledJobsData?.data?.scheduledJobs || [];
    const pagination = {
        totalCount: scheduledJobsData?.data?.totalCount || 0,
        page: scheduledJobsData?.data?.page || 1,
        pageSize: scheduledJobsData?.data?.pageSize || 20,
        totalPages: scheduledJobsData?.data?.totalPages || 1,
    };

    // Table sorting state
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'date_create', desc: true }
    ]);

    // Handle sorting change
    const handleSortingChange = useCallback<OnChangeFn<SortingState>>((updaterOrValue) => {
        const newSorting = typeof updaterOrValue === 'function' 
            ? updaterOrValue(sorting) 
            : updaterOrValue;
        
        setSorting(newSorting);
        
        if (newSorting.length > 0) {
            const sortField = newSorting[0];
            setParams((prev: IScheduledJobFilters) => ({
                ...prev,
                sort: sortField.id as IScheduledJobFilters['sort'],
                sortDirection: sortField.desc ? 'desc' : 'asc',
                page: 1,
            }));
        }
    }, [sorting]);

    // Handle search
    const handleSearch = useCallback((search: string) => {
        setParams(prev => ({
            ...prev,
            search,
            page: 1,
        }));
    }, []);

    // Handle search clear
    const handleClearSearch = useCallback(() => {
        setParams(prev => ({
            ...prev,
            search: '',
            page: 1,
        }));
    }, []);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setParams(prev => ({ ...prev, page }));
    }, []);

    // Handle page size change
    const handlePageSizeChange = useCallback((pageSize: string | null) => {
        if (pageSize) {
            setParams(prev => ({
                ...prev,
                pageSize: parseInt(pageSize, 10),
                page: 1,
            }));
        }
    }, []);

    // Handle job selection
    const handleSelectJob = useCallback((jobId: number, checked: boolean) => {
        const newSelected = new Set(selectedJobs);
        if (checked) {
            newSelected.add(jobId);
        } else {
            newSelected.delete(jobId);
        }
        setSelectedJobs(newSelected);
    }, [selectedJobs]);

    // Handle select all
    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedJobs(new Set(scheduledJobs.map(job => job.id)));
        } else {
            setSelectedJobs(new Set());
        }
    }, [scheduledJobs]);

    // Handle bulk delete
    const handleBulkDelete = useCallback(() => {
        const selectedJobIds = Array.from(selectedJobs);
        const selectedJobDescriptions = scheduledJobs
            .filter(job => selectedJobs.has(job.id))
            .map(job => job.description);
        
        if (onBulkDeleteJobs && selectedJobIds.length > 0) {
            onBulkDeleteJobs(selectedJobIds, selectedJobDescriptions);
        }
    }, [selectedJobs, scheduledJobs, onBulkDeleteJobs]);

    // Handle row expansion
    const handleRowExpansion = useCallback((jobId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(jobId)) {
            newExpanded.delete(jobId);
        } else {
            newExpanded.add(jobId);
        }
        setExpandedRows(newExpanded);
    }, [expandedRows]);

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'queued': return 'blue';
            case 'done': return 'green';
            case 'failed': return 'orange';
            case 'deleted': return 'red';
            default: return 'gray';
        }
    };

    // Format date in European style
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Define table columns
    const columns = useMemo<ColumnDef<IScheduledJob>[]>(
        () => [
            {
                id: 'expand',
                header: '',
                cell: ({ row }) => (
                    <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => handleRowExpansion(row.original.id)}
                    >
                        {expandedRows.has(row.original.id) ? (
                            <IconMinus size={14} />
                        ) : (
                            <IconPlus size={14} />
                        )}
                    </ActionIcon>
                ),
                enableSorting: false,
            },
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        indeterminate={table.getIsSomePageRowsSelected()}
                        onChange={(event) => {
                            table.toggleAllPageRowsSelected(!!event.currentTarget.checked);
                            handleSelectAll(!!event.currentTarget.checked);
                        }}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={selectedJobs.has(row.original.id)}
                        onChange={(event) => handleSelectJob(row.original.id, event.currentTarget.checked)}
                    />
                ),
                enableSorting: false,
            },
            {
                accessorKey: 'id',
                header: ({ column }) => (
                    <Group gap="xs">
                        <Text fw={500}>ID</Text>
                        <ActionIcon
                            variant="transparent"
                            size="xs"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {column.getIsSorted() === 'asc' ? (
                                <IconSortAscending size={14} />
                            ) : column.getIsSorted() === 'desc' ? (
                                <IconSortDescending size={14} />
                            ) : (
                                <IconSortAscending size={14} opacity={0.5} />
                            )}
                        </ActionIcon>
                    </Group>
                ),
                cell: ({ row }) => (
                    <Text size="sm" fw={500}>
                        {row.original.id}
                    </Text>
                ),
                enableSorting: true,
            },
            {
                accessorKey: 'status',
                header: ({ column }) => (
                    <Group gap="xs">
                        <Text fw={500}>Status</Text>
                        <ActionIcon
                            variant="transparent"
                            size="xs"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {column.getIsSorted() === 'asc' ? (
                                <IconSortAscending size={14} />
                            ) : column.getIsSorted() === 'desc' ? (
                                <IconSortDescending size={14} />
                            ) : (
                                <IconSortAscending size={14} opacity={0.5} />
                            )}
                        </ActionIcon>
                    </Group>
                ),
                cell: ({ row }) => (
                    <Badge
                        variant="light"
                        color={getStatusColor(row.original.status)}
                        size="sm"
                    >
                        {row.original.status}
                    </Badge>
                ),
                enableSorting: true,
            },
            {
                accessorKey: 'type',
                header: ({ column }) => (
                    <Group gap="xs">
                        <Text fw={500}>Type</Text>
                        <ActionIcon
                            variant="transparent"
                            size="xs"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {column.getIsSorted() === 'asc' ? (
                                <IconSortAscending size={14} />
                            ) : column.getIsSorted() === 'desc' ? (
                                <IconSortDescending size={14} />
                            ) : (
                                <IconSortAscending size={14} opacity={0.5} />
                            )}
                        </ActionIcon>
                    </Group>
                ),
                cell: ({ row }) => (
                    <Text size="sm">{row.original.type}</Text>
                ),
                enableSorting: true,
            },
            {
                accessorKey: 'date_create',
                header: ({ column }) => (
                    <Group gap="xs">
                        <Text fw={500}>Entry Date</Text>
                        <ActionIcon
                            variant="transparent"
                            size="xs"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {column.getIsSorted() === 'asc' ? (
                                <IconSortAscending size={14} />
                            ) : column.getIsSorted() === 'desc' ? (
                                <IconSortDescending size={14} />
                            ) : (
                                <IconSortAscending size={14} opacity={0.5} />
                            )}
                        </ActionIcon>
                    </Group>
                ),
                cell: ({ row }) => (
                    <Text size="sm">{formatDate(row.original.entry_date)}</Text>
                ),
                enableSorting: true,
            },
            {
                accessorKey: 'date_to_be_executed',
                header: ({ column }) => (
                    <Group gap="xs">
                        <Text fw={500}>Date to be Executed</Text>
                        <ActionIcon
                            variant="transparent"
                            size="xs"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {column.getIsSorted() === 'asc' ? (
                                <IconSortAscending size={14} />
                            ) : column.getIsSorted() === 'desc' ? (
                                <IconSortDescending size={14} />
                            ) : (
                                <IconSortAscending size={14} opacity={0.5} />
                            )}
                        </ActionIcon>
                    </Group>
                ),
                cell: ({ row }) => (
                    <Text size="sm">{formatDate(row.original.date_to_be_executed)}</Text>
                ),
                enableSorting: true,
            },
            {
                accessorKey: 'date_executed',
                header: ({ column }) => (
                    <Group gap="xs">
                        <Text fw={500}>Execution Date</Text>
                        <ActionIcon
                            variant="transparent"
                            size="xs"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {column.getIsSorted() === 'asc' ? (
                                <IconSortAscending size={14} />
                            ) : column.getIsSorted() === 'desc' ? (
                                <IconSortDescending size={14} />
                            ) : (
                                <IconSortAscending size={14} opacity={0.5} />
                            )}
                        </ActionIcon>
                    </Group>
                ),
                cell: ({ row }) => (
                    <Text size="sm">
                        {row.original.execution_date ? formatDate(row.original.execution_date) : '-'}
                    </Text>
                ),
                enableSorting: true,
            },
            {
                accessorKey: 'description',
                header: ({ column }) => (
                    <Group gap="xs">
                        <Text fw={500}>Description</Text>
                        <ActionIcon
                            variant="transparent"
                            size="xs"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {column.getIsSorted() === 'asc' ? (
                                <IconSortAscending size={14} />
                            ) : column.getIsSorted() === 'desc' ? (
                                <IconSortDescending size={14} />
                            ) : (
                                <IconSortAscending size={14} opacity={0.5} />
                            )}
                        </ActionIcon>
                    </Group>
                ),
                cell: ({ row }) => (
                    <Text size="sm" className={classes.descriptionText} truncate>
                        {row.original.description}
                    </Text>
                ),
                enableSorting: true,
            },
            {
                accessorKey: 'recipient',
                header: 'Recipient',
                cell: ({ row }) => (
                    <Text size="sm" className={classes.recipientText} truncate>
                        {row.original.recipient || '-'}
                    </Text>
                ),
            },
            {
                accessorKey: 'title',
                header: 'Title',
                cell: ({ row }) => (
                    <Text size="sm" className={classes.titleText} truncate>
                        {row.original.title || '-'}
                    </Text>
                ),
            },
            {
                accessorKey: 'message',
                header: 'Message',
                cell: ({ row }) => (
                    <Text size="sm" className={classes.messageText} truncate>
                        {row.original.message || '-'}
                    </Text>
                ),
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <ActionIcon variant="subtle" size="sm">
                                <IconDots size={16} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item
                                leftSection={<IconEye size={14} />}
                                onClick={() => onViewJob?.(row.original.id)}
                            >
                                View Details
                            </Menu.Item>
                            <Menu.Item
                                leftSection={<IconPlayerPlay size={14} />}
                                onClick={() => onExecuteJob?.(row.original.id)}
                            >
                                Execute Job
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => onDeleteJob?.(row.original.id, row.original.description)}
                            >
                                Delete Job
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                ),
            },
        ],
        [selectedJobs, handleSelectJob, handleSelectAll, onViewJob, onExecuteJob, onDeleteJob, expandedRows, handleRowExpansion]
    );

    // Initialize table
    const table = useReactTable({
        data: scheduledJobs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualSorting: true,
        manualPagination: true,
        state: {
            sorting,
        },
        onSortingChange: handleSortingChange,
        enableSortingRemoval: false,
    });

    if (error) {
        return (
            <Card>
                <Text c="red" ta="center">
                    Failed to load scheduled jobs. Please try again.
                </Text>
            </Card>
        );
    }

    return (
        <Card>
            <Stack gap="md">
                {/* Header */}
                <Group justify="space-between">
                    <div>
                        <Text size="lg" fw={600}>
                            Scheduled Jobs
                        </Text>
                        <Text size="sm" c="dimmed">
                            Manage and monitor scheduled jobs
                        </Text>
                    </div>
                    <Group>
                        {selectedJobs.size > 0 && (
                            <Button
                                color="red"
                                leftSection={<IconTrash size={16} />}
                                onClick={handleBulkDelete}
                            >
                                Delete Selected ({selectedJobs.size})
                            </Button>
                        )}
                    </Group>
                </Group>

                {/* Filters */}
                <Group gap="md" wrap="nowrap">
                    <TextInput
                        placeholder="Search jobs..."
                        leftSection={<IconSearch size={16} />}
                        rightSection={
                            params.search ? (
                                <ActionIcon
                                    variant="subtle"
                                    size="sm"
                                    onClick={handleClearSearch}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            ) : null
                        }
                        value={params.search || ''}
                        onChange={(event) => handleSearch(event.currentTarget.value)}
                        className={classes.searchInput}
                    />
                    
                    <Button
                        variant={showFilters ? 'filled' : 'light'}
                        leftSection={<IconFilter size={16} />}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        Filters
                    </Button>
                    
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={() => refetch()}
                    >
                        Refresh
                    </Button>
                    
                    <Select
                        value={params.pageSize?.toString() || '20'}
                        onChange={handlePageSizeChange}
                        data={[
                            { value: '10', label: '10 per page' },
                            { value: '20', label: '20 per page' },
                            { value: '50', label: '50 per page' },
                            { value: '100', label: '100 per page' },
                        ]}
                        className={classes.pageSizeSelect}
                    />
                </Group>

                {/* Advanced Filters */}
                {showFilters && (
                    <Paper p="md" withBorder>
                        <Stack gap="md">
                            <Group gap="md" wrap="nowrap">
                                <Select
                                    placeholder="Status"
                                    data={statusOptions}
                                    value={params.status || ''}
                                    onChange={(value) => setParams(prev => ({ ...prev, status: value || undefined, page: 1 }))}
                                    clearable
                                    className={classes.filterSelect}
                                />
                                <Select
                                    placeholder="Type"
                                    data={typeOptions}
                                    value={params.jobType || ''}
                                    onChange={(value) => setParams(prev => ({ ...prev, jobType: value || undefined, page: 1 }))}
                                    clearable
                                    className={classes.filterSelect}
                                />
                                <Select
                                    placeholder="Date Type"
                                    data={dateTypeOptions}
                                    value={params.dateType || ''}
                                    onChange={(value) => setParams(prev => ({
                                        ...prev,
                                        dateType: value as IScheduledJobFilters['dateType'] || 'date_to_be_executed',
                                        page: 1
                                    }))}
                                    className={classes.filterSelect}
                                />
                            </Group>
                            <Group gap="md" wrap="nowrap">
                                <DateInput
                                    placeholder="Date From"
                                    value={params.dateFrom ? new Date(params.dateFrom) : null}
                                    onChange={(date) => setParams(prev => ({
                                        ...prev,
                                        dateFrom: date ? (date as unknown as Date).toISOString().split('T')[0] : undefined,
                                        page: 1
                                    }))}
                                    clearable
                                    className={classes.dateFilterInput}
                                />
                                <DateInput
                                    placeholder="Date To"
                                    value={params.dateTo ? new Date(params.dateTo) : null}
                                    onChange={(date) => setParams(prev => ({
                                        ...prev,
                                        dateTo: date ? (date as unknown as Date).toISOString().split('T')[0] : undefined,
                                        page: 1
                                    }))}
                                    clearable
                                    className={classes.dateFilterInput}
                                />
                            </Group>
                        </Stack>
                    </Paper>
                )}

                {/* Table */}
                <div className={classes.tableWrapper}>
                    <LoadingOverlay visible={isLoading} />

                    <Box className={classes.tableScrollContainer}>
                        <Table striped highlightOnHover>
                            <TableThead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableTr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableTh key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableTh>
                                        ))}
                                    </TableTr>
                                ))}
                            </TableThead>
                            <TableTbody>
                                {table.getRowModel().rows.map((row) => (
                                    <React.Fragment key={row.id}>
                                        <TableTr>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableTd key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableTd>
                                            ))}
                                        </TableTr>
                                        {expandedRows.has(row.original.id) && (
                                            <TableTr key={`${row.id}-transactions`}>
                                                <TableTd colSpan={row.getVisibleCells().length}>
                                                    <TransactionsTable transactions={row.original.transactions} />
                                                </TableTd>
                                            </TableTr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableTbody>
                        </Table>
                    </Box>

                    {/* Empty state */}
                    {!isLoading && scheduledJobs.length === 0 && (
                        <Center py="xl">
                            <Stack align="center" gap="sm">
                                <Text size="lg" c="dimmed">
                                    No scheduled jobs found
                                </Text>
                                <Text size="sm" c="dimmed">
                                    {params.search 
                                        ? 'Try adjusting your search criteria'
                                        : 'No jobs are currently scheduled'
                                    }
                                </Text>
                            </Stack>
                        </Center>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <Group justify="center">
                        <Pagination
                            total={pagination.totalPages}
                            value={pagination.page}
                            onChange={handlePageChange}
                        />
                    </Group>
                )}

                {/* Results info */}
                <Text size="sm" c="dimmed" ta="center">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} entries
                </Text>
            </Stack>
        </Card>
    );
}

// Transactions Table Component
interface ITransactionsTableProps {
    transactions: IScheduledJobTransaction[];
}

function TransactionsTable({ transactions }: ITransactionsTableProps) {
    // Format date in European style
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <Paper p="md" withBorder>
            <Text size="sm" fw={500} mb="md">Transactions</Text>
            {transactions.length > 0 ? (
                <Table>
                    <TableThead>
                        <TableTr>
                            <TableTh>Transaction ID</TableTh>
                            <TableTh>Transaction Time</TableTh>
                            <TableTh>Transaction Type</TableTh>
                            <TableTh>User</TableTh>
                            <TableTh>Transaction Log</TableTh>
                        </TableTr>
                    </TableThead>
                    <TableTbody>
                        {transactions.map((transaction) => (
                            <TableTr key={transaction.transaction_id}>
                                <TableTd>
                                    <Text size="xs" fw={500}>
                                        {transaction.transaction_id}
                                    </Text>
                                </TableTd>
                                <TableTd>
                                    <Text size="xs">
                                        {formatDate(transaction.transaction_time)}
                                    </Text>
                                </TableTd>
                                <TableTd>
                                    <Text size="xs">
                                        {transaction.transaction_type}
                                    </Text>
                                </TableTd>
                                <TableTd>
                                    <Text size="xs">
                                        {transaction.user}
                                    </Text>
                                </TableTd>
                                <TableTd>
                                    <Text size="xs" className={classes.transactionLogText} truncate>
                                        {transaction.transaction_verbal_log}
                                    </Text>
                                </TableTd>
                            </TableTr>
                        ))}
                    </TableTbody>
                </Table>
            ) : (
                <Text size="sm" c="dimmed">No transactions found for this job</Text>
            )}
        </Paper>
    );
} 