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
  Container,
  Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconSearch,
  IconTrash,
  IconDots,
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
import { getJobStatusColor } from '../utils/job-status';
import { ScheduledJobActionsMenuItems } from '../utils/ScheduledJobActionsMenuItems';
interface IScheduledJobsListProps {
    onViewJob?: (jobId: number) => void;
    onExecuteJob?: (jobId: number) => void;
    onDeleteJob?: (jobId: number, description: string) => void;
    onBulkDeleteJobs?: (jobIds: number[], descriptions: string[]) => void;
}

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

// Component for displaying transactions sub-table
function TransactionsSubTable({ transactions }: { transactions: IScheduledJobTransaction[] }) {
    return (
        <div style={{ marginLeft: 40, marginTop: 8, marginBottom: 16 }}>
            <Paper p="xs" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text size="sm" fw={600} mb="xs">
                    Transactions ({transactions.length})
                </Text>
                <Table striped>
                    <TableThead>
                        <TableTr>
                            <TableTh>ID</TableTh>
                            <TableTh>Time</TableTh>
                            <TableTh>Type</TableTh>
                            <TableTh>User</TableTh>
                            <TableTh>Log</TableTh>
                        </TableTr>
                    </TableThead>
                    <TableTbody>
                        {transactions.map((transaction) => (
                            <TableTr key={transaction.transaction_id}>
                                <TableTd>{transaction.transaction_id}</TableTd>
                                <TableTd>{formatDate(transaction.transaction_time)}</TableTd>
                                <TableTd>
                                    <Badge size="xs" variant="light">
                                        {transaction.transaction_type}
                                    </Badge>
                                </TableTd>
                                <TableTd>{transaction.user}</TableTd>
                                <TableTd>
                                    <Text size="sm" className={classes.descriptionText} truncate>
                                        {transaction.transaction_verbal_log}
                                    </Text>
                                </TableTd>
                            </TableTr>
                        ))}
                    </TableTbody>
                </Table>
            </Paper>
        </div>
    );
}

export function ScheduledJobsList({
    onViewJob,
    onExecuteJob,
    onDeleteJob,
    onBulkDeleteJobs,
}: IScheduledJobsListProps) {
    // State for table parameters
    const [filterParams, setFilterParams] = useState<IScheduledJobFilters>({
        page: 1,
        pageSize: 20,
        dateType: 'date_to_be_executed',
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        includeTransactions: true,
    });

    const [params, setParams] = useState<IScheduledJobFilters>(filterParams);

    const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
    const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());

    // Real API calls
    const { data: scheduledJobsData, isFetching, error, refetch } = useScheduledJobs(params);
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
        { id: 'date_created', desc: true }
    ]);

    // Apply Filters
    const handleApplyFilters = useCallback(() => {
    setParams({
        ...filterParams,
        page: 1,
    });
    }, [filterParams]);

    // Reset Filters
  const handleResetFilters = useCallback(() => {
    const defaultParams: IScheduledJobFilters = {
      page: 1,
      pageSize: 20,
      dateType: "date_to_be_executed",
      dateFrom: new Date().toISOString().split("T")[0],
      dateTo: new Date().toISOString().split("T")[0],
      includeTransactions: true,
    };
    setFilterParams(defaultParams);
    setParams(defaultParams);
  }, []);

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
        setFilterParams(prev => ({
            ...prev,
            search,
            page: 1,
        }));
    }, []);

    // Handle search clear
    const handleClearSearch = useCallback(() => {
        setFilterParams(prev => ({
            ...prev,
            search: '',
            page: 1,
        }));
    }, []);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setFilterParams(prev => ({ ...prev, page }));
    }, []);

    // Handle page size change
    const handlePageSizeChange = useCallback((pageSize: string | null) => {
        if (pageSize) {
            setFilterParams(prev => ({
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
    const handleToggleExpand = useCallback((jobId: number) => {
        const newExpanded = new Set(expandedJobs);
        if (newExpanded.has(jobId)) {
            newExpanded.delete(jobId);
        } else {
            newExpanded.add(jobId);
        }
        setExpandedJobs(newExpanded);
    }, [expandedJobs]);


    // Define table columns
    const columns = useMemo<ColumnDef<IScheduledJob>[]>(
      () => [
        {
          id: "expand",
          header: "",
          cell: ({ row }) => {
            const hasTransactions =
              row.original.transactions && row.original.transactions.length > 0;
            const isExpanded = expandedJobs.has(row.original.id);

            if (!hasTransactions) {
              return <div style={{ width: 24 }} />;
            }

            return (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => handleToggleExpand(row.original.id)}
              >
                {isExpanded ? <IconMinus size={14} /> : <IconPlus size={14} />}
              </ActionIcon>
            );
          },
          enableSorting: false,
          size: 40,
        },
        {
          id: "select",
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
              onChange={(event) =>
                handleSelectJob(row.original.id, event.currentTarget.checked)
              }
            />
          ),
          enableSorting: false,
        },
        {
          accessorKey: "id",
          header: ({ column }) => (
            <Group
              gap="xs"
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => column.toggleSorting()}
            >
              <Text fw={500}>ID</Text>
              {{
                asc: <IconSortAscending size={14} />,
                desc: <IconSortDescending size={14} />,
              }[column.getIsSorted() as string] || (
                <IconSortAscending size={14} opacity={0.5} />
              )}
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
          accessorKey: "date_created",
          header: ({ column }) => (
            <Group gap="xs">
              <Text fw={500}>Entry Date</Text>
              <ActionIcon
                variant="transparent"
                size="xs"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                {column.getIsSorted() === "asc" ? (
                  <IconSortAscending size={14} />
                ) : column.getIsSorted() === "desc" ? (
                  <IconSortDescending size={14} />
                ) : (
                  <IconSortAscending size={14} opacity={0.5} />
                )}
              </ActionIcon>
            </Group>
          ),
          cell: ({ row }) => (
            <Text size="sm">{formatDate(row.original.date_created)}</Text>
          ),
          enableSorting: true,
        },
        {
          accessorKey: "date_to_be_executed",
          header: ({ column }) => (
            <Group gap="xs">
              <Text fw={500}>Date to be Executed</Text>
              <ActionIcon
                variant="transparent"
                size="xs"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                {column.getIsSorted() === "asc" ? (
                  <IconSortAscending size={14} />
                ) : column.getIsSorted() === "desc" ? (
                  <IconSortDescending size={14} />
                ) : (
                  <IconSortAscending size={14} opacity={0.5} />
                )}
              </ActionIcon>
            </Group>
          ),
          cell: ({ row }) => (
            <Text size="sm">
              {formatDate(row.original.date_to_be_executed)}
            </Text>
          ),
          enableSorting: true,
        },
        {
          accessorKey: "date_executed",
          header: ({ column }) => (
            <Group gap="xs">
              <Text fw={500}>Execution Date</Text>
              <ActionIcon
                variant="transparent"
                size="xs"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                {column.getIsSorted() === "asc" ? (
                  <IconSortAscending size={14} />
                ) : column.getIsSorted() === "desc" ? (
                  <IconSortDescending size={14} />
                ) : (
                  <IconSortAscending size={14} opacity={0.5} />
                )}
              </ActionIcon>
            </Group>
          ),
          cell: ({ row }) => (
            <Text size="sm">
              {row.original.date_executed
                ? formatDate(row.original.date_executed)
                : "-"}
            </Text>
          ),
          enableSorting: true,
        },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <Badge
              variant="light"
              color={getJobStatusColor(row.original.status)}
              size="sm"
            >
              {row.original.status}
            </Badge>
          ),
          enableSorting: false,
        },
        {
          accessorKey: "job_types",
          header: "Type",
          cell: ({ row }) => <Text size="sm">{row.original.job_types}</Text>,
          enableSorting: true,
        },
        {
          accessorKey: "description",
          header: "Description",
          cell: ({ row }) => (
            <Tooltip
              label={row.original.description}
              position="top-start"
              withArrow
              multiline
            >
              <Text size="sm" className={classes.descriptionText} truncate>
                {row.original.description}
              </Text>
            </Tooltip>
          ),
        },
        {
          accessorKey: "user_email",
          header: "User Email",
          cell: ({ row }) => (
            <Tooltip
              label={row.original.user_email || "-"}
              position="top-start"
              withArrow
            >
              <Text size="sm" className={classes.recipientText} truncate>
                {row.original.user_email || "-"}
              </Text>
            </Tooltip>
          ),
        },
        {
          accessorKey: "config.email.subject",
          header: "Email Subject",
          cell: ({ row }) => (
            <Tooltip
              label={row.original.config?.email?.subject || "-"}
              position="top-start"
              withArrow
              multiline
            >
              <Text size="sm" className={classes.titleText} truncate>
                {row.original.config?.email?.subject || "-"}
              </Text>
            </Tooltip>
          ),
        },
        {
          accessorKey: "user_timezone",
          header: "User Timezone",
          cell: ({ row }) => (
            <Text size="sm">{row.original.user_timezone || "-"}</Text>
          ),
        },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <ScheduledJobActionsMenuItems
                  jobId={row.original.id}
                  status={row.original.status}
                  description={row.original.description}
                  onViewJob={onViewJob}
                  onExecuteJob={onExecuteJob}
                  onDeleteJob={onDeleteJob}
                />
              </Menu.Dropdown>
            </Menu>
          ),
        },
      ],
      [
        selectedJobs,
        handleSelectJob,
        handleSelectAll,
        onViewJob,
        onExecuteJob,
        onDeleteJob,
        expandedJobs,
        handleToggleExpand,
      ],
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
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Group justify="space-between">
              <Container pl={0}>
                <Group gap={8} align="center">
                  <Text size="lg" fw={600}>
                    Scheduled Jobs
                  </Text>
                  {pagination && pagination.totalCount > 0 && (
                    <Badge ml={4} variant="light" color="gray" size="sm">
                      {pagination?.totalCount}
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed">
                  Manage and monitor scheduled jobs
                </Text>
              </Container>
            </Group>

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

          {/* Advanced Filters */}
            <Paper p="md" withBorder>
              <Stack gap="md">
                <Group gap="md" wrap="nowrap">
                  <TextInput
                    label="Search"
                    placeholder="Search jobs..."
                    leftSection={<IconSearch size={16} />}
                    rightSection={
                      filterParams.search ? (
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={handleClearSearch}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      ) : null
                    }
                    value={filterParams.search || ""}
                    onChange={(event) =>
                      handleSearch(event.currentTarget.value)
                    }
                    className={classes.searchInput}
                  />
                  <Select
                    label="Status"
                    placeholder="Status"
                    data={statusOptions}
                    value={filterParams.status || ""}
                    onChange={(value) =>
                      setFilterParams((prev) => ({
                        ...prev,
                        status: value || undefined,
                        page: 1,
                      }))
                    }
                    clearable
                    className={classes.filterSelect}
                  />
                  <Select
                    label="Type"
                    placeholder="Type"
                    data={typeOptions}
                    value={filterParams.jobType || ""}
                    onChange={(value) =>
                      setFilterParams((prev) => ({
                        ...prev,
                        jobType: value || undefined,
                        page: 1,
                      }))
                    }
                    clearable
                    className={classes.filterSelect}
                  />
                  <Select
                    label="Date Type"
                    placeholder="Date Type"
                    data={dateTypeOptions}
                    value={filterParams.dateType || ""}
                    onChange={(value) =>
                      setFilterParams((prev) => ({
                        ...prev,
                        dateType:
                          (value as IScheduledJobFilters["dateType"]) ||
                          "date_to_be_executed",
                        page: 1,
                      }))
                    }
                    className={classes.filterSelect}
                  />
                </Group>
                <Group gap="md" wrap="nowrap">
                  <DateInput
                    label="Date From"
                    placeholder="Date From"
                    value={
                      filterParams.dateFrom
                        ? new Date(filterParams.dateFrom)
                        : null
                    }
                    onChange={(date) =>
                      setFilterParams((prev) => ({
                        ...prev,
                        dateFrom: date || undefined,
                        page: 1,
                      }))
                    }
                    clearable
                    className={classes.dateFilterInput}
                  />
                  <DateInput
                    label="Date To"
                    placeholder="Date To"
                    value={
                      filterParams.dateTo ? new Date(filterParams.dateTo) : null
                    }
                    onChange={(date) =>
                      setFilterParams((prev) => ({
                        ...prev,
                        dateTo: date || undefined,
                        page: 1,
                      }))
                    }
                    clearable
                    className={classes.dateFilterInput}
                  />
                  <Select
                    label="Rows per page"
                    value={filterParams.pageSize?.toString() || "20"}
                    onChange={handlePageSizeChange}
                    data={[
                      { value: "10", label: "10 per page" },
                      { value: "20", label: "20 per page" },
                      { value: "50", label: "50 per page" },
                      { value: "100", label: "100 per page" },
                    ]}
                    className={classes.pageSizeSelect}
                  />
                </Group>
                <Group gap="sm" wrap="nowrap" justify="flex-end">
                  <Button
                    variant="filled"
                    color="blue"
                    onClick={handleApplyFilters}
                    loading={isFetching}
                    disabled={filterParams === params}
                  >
                    Apply Filters
                  </Button>

                <Button
                    color="red"
                    variant="filled"
                    onClick={handleResetFilters}
                    loading={isFetching}
                    disabled={filterParams === params}
                  >
                    Reset
                  </Button>

                  <Button
                    variant="light"
                    leftSection={<IconRefresh size={16} />}
                    onClick={() => refetch()}
                    loading={isFetching}
                    disabled={isFetching}
                  >
                    Refresh
                  </Button>
                </Group>
              </Stack>
            </Paper>

          {/* Table */}
          <div className={classes.tableWrapper}>
            <LoadingOverlay visible={isFetching} />

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
                                header.getContext(),
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
                              cell.getContext(),
                            )}
                          </TableTd>
                        ))}
                      </TableTr>
                      {expandedJobs.has(row.original.id) &&
                        row.original.transactions && (
                          <TableTr>
                            <TableTd
                              colSpan={table.getAllColumns().length}
                              style={{ padding: 0, border: "none" }}
                            >
                              <TransactionsSubTable
                                transactions={row.original.transactions}
                              />
                            </TableTd>
                          </TableTr>
                        )}
                    </React.Fragment>
                  ))}
                </TableTbody>
              </Table>
            </Box>

            {/* Empty state */}
            {!isFetching && scheduledJobs.length === 0 && (
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <Text size="lg" c="dimmed">
                    No scheduled jobs found
                  </Text>
                  <Text size="sm" c="dimmed">
                    {params.search
                      ? "Try adjusting your search criteria"
                      : "No jobs are currently scheduled"}
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
        {pagination.totalCount === 0
            ? "Showing 0 entries"
            : `Showing ${(pagination.page - 1) * pagination.pageSize + 1} to ${Math.min(
                pagination.page * pagination.pageSize,
                pagination.totalCount,
            )} of ${pagination.totalCount} entries`}
        </Text>
        </Stack>
      </Card>
    );
}
