"use client";

import { useState, useEffect, useMemo } from 'react';
import {
    Group,
    Select,
    Button,
    Stack,
    Divider,
    Badge,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconX } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import type { IAuditLogsListParams } from '../../../../../types/responses/admin/audit.types';
import type { ILookup } from '../../../../../types/responses/admin/lookups.types';

interface AuditLogsFiltersProps {
    filters: IAuditLogsListParams;
    onFiltersChange: (filters: Partial<IAuditLogsListParams>) => void;
}


export function AuditLogsFilters({ filters, onFiltersChange }: AuditLogsFiltersProps) {
    const [localFilters, setLocalFilters] = useState<IAuditLogsListParams>(filters);

    // Fetch dynamic lookups
    const resourceTypes = useLookupsByType('resourceTypes');
    const actions = useLookupsByType('auditActions');
    const permissionResults = useLookupsByType('permissionResults');

    // Create select options from lookups
    const resourceTypeOptions = useMemo(() =>
        resourceTypes.map((lookup: ILookup) => ({
            value: lookup.lookupCode,
            label: lookup.lookupValue,
        })), [resourceTypes]
    );

    const actionOptions = useMemo(() =>
        actions.map((lookup: ILookup) => ({
            value: lookup.lookupCode,
            label: lookup.lookupValue,
        })), [actions]
    );

    const permissionResultOptions = useMemo(() =>
        permissionResults.map((lookup: ILookup) => ({
            value: lookup.lookupCode,
            label: lookup.lookupValue,
        })), [permissionResults]
    );

    // HTTP methods (these are not in lookups, keep hardcoded)
    const httpMethodOptions = [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
    ];

    // Update local state when filters prop changes
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleFilterChange = (key: keyof IAuditLogsListParams, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        // Note: We don't call onFiltersChange here - only when Apply Filters is clicked
    };

    const handleImmediateFilterChange = (key: keyof IAuditLogsListParams, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        // Apply immediately for date filters
        const cleanedFilters = Object.fromEntries(
            Object.entries(newFilters).filter(([, val]) =>
                val !== undefined && val !== null && val !== ''
            )
        );
        onFiltersChange(cleanedFilters);
    };

    const applyFilters = () => {
        // Remove empty/undefined values
        const cleanedFilters = Object.fromEntries(
            Object.entries(localFilters).filter(([, value]) =>
                value !== undefined && value !== null && value !== ''
            )
        );
        onFiltersChange(cleanedFilters);
    };

    const clearFilters = () => {
        const emptyFilters = {
            page: 1,
            pageSize: filters.pageSize || 20, // Keep current page size
        };
        setLocalFilters(emptyFilters);
        onFiltersChange(emptyFilters);
    };

    const hasActiveFilters = Object.entries(localFilters).some(([key, value]) => {
        if (key === 'page' || key === 'pageSize') return false;
        return value !== undefined && value !== null && value !== '';
    });

    return (
        <div className="space-y-4">
            <Divider />

            <Stack>
                {/* Row 1: Resource type, Action */}
                <Group grow>
                    <Select
                        label="Resource Type"
                        placeholder="Select resource type"
                        data={resourceTypeOptions}
                        value={localFilters.resource_type || null}
                        onChange={(value) => handleFilterChange('resource_type', value || undefined)}
                        clearable
                    />
                    <Select
                        label="Action"
                        placeholder="Select action"
                        data={actionOptions}
                        value={localFilters.action || null}
                        onChange={(value) => handleFilterChange('action', value || undefined)}
                        clearable
                    />
                    <Select
                        label="Permission Result"
                        placeholder="Select result"
                        data={permissionResultOptions}
                        value={localFilters.permission_result || null}
                        onChange={(value) => handleFilterChange('permission_result', value || undefined)}
                        clearable
                    />
                </Group>

                {/* Row 2: HTTP method, Date range */}
                <Group grow>
                    <Select
                        label="HTTP Method"
                        placeholder="Select method"
                        data={httpMethodOptions}
                        value={localFilters.http_method || null}
                        onChange={(value) => handleFilterChange('http_method', value || undefined)}
                        clearable
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <DatePickerInput
                            label="From Date"
                            placeholder="YYYY-MM-DD"
                            value={localFilters.date_from ? new Date(localFilters.date_from) : null}
                            onChange={(date) => {
                                let dateStr: string | undefined;
                                if (date) {
                                    const dateObj = typeof date === 'string' ? new Date(date) : date;
                                    if (!isNaN(dateObj.getTime())) {
                                        dateStr = dateObj.toISOString().split('T')[0];
                                    }
                                }
                                handleImmediateFilterChange('date_from', dateStr);
                            }}
                            clearable
                        />
                        <DatePickerInput
                            label="To Date"
                            placeholder="YYYY-MM-DD"
                            value={localFilters.date_to ? new Date(localFilters.date_to) : null}
                            onChange={(date) => {
                                let dateStr: string | undefined;
                                if (date) {
                                    const dateObj = typeof date === 'string' ? new Date(date) : date;
                                    if (!isNaN(dateObj.getTime())) {
                                        dateStr = dateObj.toISOString().split('T')[0];
                                    }
                                }
                                handleImmediateFilterChange('date_to', dateStr);
                            }}
                            clearable
                        />
                    </div>
                </Group>

                {/* Action buttons */}
                <Group justify="space-between">
                    <div>
                        {hasActiveFilters && (
                            <Badge variant="light" color="blue">
                                Filters active
                            </Badge>
                        )}
                    </div>
                    <Group>
                        <Button variant="light" onClick={clearFilters} leftSection={<IconX size={16} />}>
                            Clear Filters
                        </Button>
                        <Button onClick={applyFilters}>
                            Apply Filters
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </div>
    );
}
