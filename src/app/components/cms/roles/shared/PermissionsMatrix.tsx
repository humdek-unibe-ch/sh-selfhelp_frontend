"use client";

import { useState, useMemo } from 'react';
import {
    Table,
    TableTbody,
    TableTd,
    TableTh,
    TableThead,
    TableTr,
    Checkbox,
    Text,
    Badge,
    Group,
    ActionIcon,
    TextInput,
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { ICrudPermissions } from '../../../../../utils/permissions.utils';

export interface IPermissionRow {
    id: number | string;
    name: string;
    displayName?: string;
    description?: string;
    permissions: ICrudPermissions;
    hasChanges: boolean;
    existingPermissionId?: number;
    // Additional metadata for rendering
    badges?: Array<{ label: string; color: string; variant?: 'light' | 'filled' | 'outline' | 'subtle' }>;
    extraInfo?: React.ReactNode;
}

export interface IPermissionsMatrixProps {
    title: string;
    icon?: React.ReactNode;
    permissionRows: IPermissionRow[];
    permissionColumns: (keyof ICrudPermissions)[];
    searchPlaceholder: string;
    onPermissionChange: (rowId: number | string, permission: keyof ICrudPermissions, value: boolean) => void;
    renderNameCell: (row: IPermissionRow) => React.ReactNode;
    renderInfoCell: (row: IPermissionRow) => React.ReactNode;
    renderStatusCell: (row: IPermissionRow) => React.ReactNode;
}

export function PermissionsMatrix({
    title,
    icon,
    permissionRows,
    permissionColumns,
    searchPlaceholder,
    onPermissionChange,
    renderNameCell,
    renderInfoCell,
    renderStatusCell,
}: IPermissionsMatrixProps) {
    const [searchFilter, setSearchFilter] = useState('');

    // Filter permission rows based on search
    const filteredPermissionRows = useMemo(() => {
        if (!searchFilter.trim()) {
            return permissionRows;
        }
        const filter = searchFilter.toLowerCase().trim();
        return permissionRows.filter(row =>
            row.name?.toLowerCase().includes(filter) ||
            row.displayName?.toLowerCase().includes(filter) ||
            row.description?.toLowerCase().includes(filter)
        );
    }, [permissionRows, searchFilter]);

    return (
        <div>
            <Text size="sm" c="dimmed" mb="md">
                Configure which {title.toLowerCase()} this role can access and what actions they can perform.
            </Text>

            {/* Search Filter */}
            <TextInput
                placeholder={searchPlaceholder}
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.currentTarget.value)}
                rightSection={
                    searchFilter ? (
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={() => setSearchFilter('')}
                        >
                            <IconX size={14} />
                        </ActionIcon>
                    ) : null
                }
                mb="md"
            />

            <Table striped highlightOnHover style={{ tableLayout: 'auto' }}>
                <TableThead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                    <TableTr>
                        <TableTh style={{ minWidth: 200 }}>
                            <Group gap="xs">
                                {icon}
                                <Text>{title}</Text>
                            </Group>
                        </TableTh>
                        <TableTh style={{ minWidth: 100 }}>Info</TableTh>
                        {permissionColumns.map(permission => (
                            <TableTh key={permission} style={{ textAlign: 'center', minWidth: 80 }}>
                                {permission.charAt(0).toUpperCase() + permission.slice(1)}
                            </TableTh>
                        ))}
                        <TableTh style={{ textAlign: 'center', minWidth: 80 }}>Status</TableTh>
                    </TableTr>
                </TableThead>
                <TableTbody>
                    {filteredPermissionRows.map((row) => (
                        <TableTr key={row.id}>
                            <TableTd>
                                {renderNameCell(row)}
                            </TableTd>
                            <TableTd>
                                {renderInfoCell(row)}
                            </TableTd>
                            {permissionColumns.map(permission => (
                                <TableTd key={permission}>
                                    <Checkbox
                                        style={{ justifySelf: 'center' }}
                                        checked={row.permissions[permission] || false}
                                        onChange={(event) => onPermissionChange(row.id, permission, event.currentTarget.checked)}
                                        size="sm"
                                    />
                                </TableTd>
                            ))}
                            <TableTd style={{ textAlign: 'center' }}>
                                {renderStatusCell(row)}
                            </TableTd>
                        </TableTr>
                    ))}
                </TableTbody>
            </Table>

            {permissionRows.length === 0 && (
                <Text ta="center" c="dimmed" py="xl">
                    No {title.toLowerCase()} available for permission management.
                </Text>
            )}

            {permissionRows.length > 0 && filteredPermissionRows.length === 0 && searchFilter && (
                <Text ta="center" c="dimmed" py="xl">
                    No {title.toLowerCase()} match your search criteria.
                </Text>
            )}
        </div>
    );
}
