"use client";

import { useState } from 'react';
import { Card, Group, Button, Text, LoadingOverlay, Select } from '@mantine/core';
import { IconRefresh, IconFilter } from '@tabler/icons-react';
import { useAuditLogs } from '../../../../../hooks/useAuditLogs';
import { AuditLogsTable } from '../audit-logs-table/AuditLogsTable';
import { AuditLogsFilters } from '../audit-logs-filters/AuditLogsFilters';
import type { IAuditLogsListParams } from '../../../../../types/responses/admin/audit.types';

interface AuditLogsListProps {
  onViewDetails?: (auditLogId: number) => void;
}

export function AuditLogsList({ onViewDetails }: AuditLogsListProps) {
  const [filters, setFilters] = useState<IAuditLogsListParams>({
    page: 1,
    pageSize: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, error, refetch } = useAuditLogs(filters);

  const handleFiltersChange = (newFilters: Partial<IAuditLogsListParams>) => {
    // Merge new filters with current filters, resetting to page 1
    const apiFilters: IAuditLogsListParams = {
      page: newFilters.page !== undefined ? newFilters.page : 1,
      pageSize: newFilters.pageSize !== undefined ? newFilters.pageSize : pageSize,
    };

    // Add only the filter parameters that should be sent to API
    if (newFilters.user_id !== undefined) apiFilters.user_id = newFilters.user_id;
    if (newFilters.resource_type) apiFilters.resource_type = newFilters.resource_type;
    if (newFilters.action) apiFilters.action = newFilters.action;
    if (newFilters.permission_result) apiFilters.permission_result = newFilters.permission_result;
    if (newFilters.date_from) apiFilters.date_from = newFilters.date_from;
    if (newFilters.date_to) apiFilters.date_to = newFilters.date_to;
    if (newFilters.http_method) apiFilters.http_method = newFilters.http_method;

    console.log('Setting filters:', apiFilters);
    setFilters(apiFilters);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setFilters(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1, // Reset to first page when page size changes
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    refetch();
  };

  const auditLogs = data?.logs || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={500}>Audit Logs</Text>
            <Text size="sm" c="dimmed">
              {pagination ? `${pagination.total} total logs` : 'Loading...'}
            </Text>
          </div>
          <Group>
            <Group gap="xs">
              <Text size="sm" c="dimmed">Show:</Text>
              <Select
                size="xs"
                w={80}
                data={[
                  { value: '20', label: '20' },
                  { value: '50', label: '50' },
                  { value: '100', label: '100' },
                ]}
                value={pageSize.toString()}
                onChange={(value) => handlePageSizeChange(parseInt(value || '20'))}
              />
            </Group>
            <Button
              variant="light"
              leftSection={<IconFilter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
              loading={isLoading}
            >
              Refresh
            </Button>
          </Group>
        </Group>

        {/* Filters */}
        {showFilters && (
          <AuditLogsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        )}
      </Card>

      {/* Table */}
      <Card withBorder pos="relative">
        <LoadingOverlay visible={isLoading} />
        <AuditLogsTable
          data={auditLogs}
          pagination={pagination}
          onPageChange={handlePageChange}
          onViewDetails={onViewDetails}
          loading={isLoading}
          error={error}
        />
      </Card>
    </div>
  );
}
