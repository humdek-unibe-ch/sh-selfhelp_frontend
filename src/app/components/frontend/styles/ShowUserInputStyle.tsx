/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useState } from 'react';
import {
    Table, Text, TextInput, Pagination, Group, ActionIcon, Modal, Stack, Button, Alert, ScrollArea
} from '@mantine/core';
import { IconTrash, IconSearch, IconAlertCircle, IconChevronUp, IconChevronDown, IconSelector, IconDownload } from '@tabler/icons-react';
import { useDeleteFormMutation } from '../../../../hooks/useFormSubmission';
import { usePageContentValue } from '../../../../hooks/usePageContentValue';
import { useAuthUser } from '../../../../hooks/useUserData';
import { IShowUserInputStyle } from '../../../../shared';


interface IFieldMapping {
    field_name: string;
    field_new_name: string;
}

interface IColumn {
    key: string;
    label: string;
}

type TSortDir = 'asc' | 'desc' | null;

interface IShowUserInputStyleProps {
    style: IShowUserInputStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

const PAGE_SIZE = 10;

const ShowUserInputStyle: React.FC<IShowUserInputStyleProps> = ({ style, styleProps, cssClass }) => {
    const pageContent = usePageContentValue();
    const { user } = useAuthUser();
    const deleteMutation = useDeleteFormMutation();

    const ownEntriesOnly = style.own_entries_only?.content === '1';
    const showTimestamp = style.show_timestamp?.content === '1';

    const sortable = style.dt_sortable?.content === '1';
    const searching = style.dt_searching?.content === '1';
    const paginate = style.dt_paginate?.content === '1';
    const info = style.dt_info?.content === '1';
    const defaultOrderCol = style.dt_default_order_column?.content ?? null;
    const defaultOrderDir = (style.dt_default_order_dir?.content ?? 'asc') as 'asc' | 'desc';
    const csvExport = style.csv_export?.content === '1';
    const deleteEntry = style.delete_entry?.content === '1';
    const spacing = style.mantine_spacing_margin_padding?.content || 'md';
    const striped = style.mantine_table_striped?.content === '1';
    const highlightOnHover = style.mantine_table_highlight_on_hover?.content !== '0';
    const withTableBorder = style.mantine_table_with_table_border?.content !== '0';
    const withColumnBorders = style.mantine_table_with_column_borders?.content !== '0';
    const withRowBorders = style.mantine_table_with_row_borders?.content === '1';
    const stickyHeader = style.mantine_table_sticky_header?.content === '1';
    const captionSide = (style.mantine_table_caption_side?.content || undefined) as 'top' | 'bottom' | undefined;

    const fieldMappings: IFieldMapping[] = (() => {
        try {
            const raw = style.fields_map?.content;
            if (raw) return JSON.parse(raw) as IFieldMapping[];
        } catch { /* fall through */ }
        return [];
    })();

    const rows = (style.entries ?? []) as Array<Record<string, unknown>>;

    const mappedCols: IColumn[] = fieldMappings.length
        ? fieldMappings.map(m => ({ key: m.field_name, label: m.field_new_name }))
        : Object.keys(rows[0] ?? {})
            .filter(k => k !== 'entry_date' && k !== 'record_id')
            .map(k => ({ key: k, label: k }));

    const leadingCol: IColumn = showTimestamp
        ? { key: 'entry_date', label: 'Date' }
        : { key: 'record_id', label: '#' };

    const allColumns: IColumn[] = [leadingCol, ...mappedCols];

    const [sortCol, setSortCol] = useState<string | null>(defaultOrderCol ?? null);
    const [sortDir, setSortDir] = useState<TSortDir>(defaultOrderCol ? (defaultOrderDir as TSortDir) : null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<{ record_id: number } | null>(null);

    const handleSort = (key: string) => {
        if (!sortable) return;
        setSortCol(prev => {
            if (prev === key) {
                setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
                return key;
            }
            setSortDir('asc');
            return key;
        });
        setPage(1);
    };

    const filtered = searching && search.trim()
        ? rows.filter(row =>
            allColumns.some(col => String(row[col.key] ?? '').toLowerCase().includes(search.toLowerCase()))
        )
        : rows;

    const sorted = sortCol && sortDir
        ? [...filtered].sort((a, b) => {
            const av = String(a[sortCol] ?? '');
            const bv = String(b[sortCol] ?? '');
            const cmp = av.localeCompare(bv, undefined, { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        })
        : filtered;

    const totalPages = paginate ? Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)) : 1;
    const pageRows = paginate ? sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : sorted;

    const canDelete = (row: Record<string, unknown>) => {
        if (!ownEntriesOnly) return true;
        if (!user) return false;
        return Number(row['id_users']) === user.id;
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget || !pageContent?.id) return;
        deleteMutation.mutate(
            { record_id: deleteTarget.record_id, page_id: pageContent.id, section_id: style.id },
            { onSettled: () => setDeleteTarget(null) }
        );
    };

    const SortIcon: React.FC<{ colKey: string }> = ({ colKey }) => {
        if (!sortable) return null;
        if (sortCol !== colKey || sortDir === null) return <IconSelector size={14} />;
        return sortDir === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />;
    };

    const startEntry = paginate ? (page - 1) * PAGE_SIZE + 1 : 1;
    const endEntry = paginate ? Math.min(page * PAGE_SIZE, sorted.length) : sorted.length;

    const handleExportCsv = () => {
        const header = allColumns.map(c => c.label).join(',');
        const body = sorted.map(row =>
            allColumns.map(c => {
                const val = String(row[c.key] ?? '');
                return val.includes(',') || val.includes('"') || val.includes('\n')
                    ? `"${val.replace(/"/g, '""')}"`
                    : val;
            }).join(',')
        ).join('\n');
        const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const tableContent = (
        <>
            <Table.Thead>
                <Table.Tr>
                    {allColumns.map(col => (
                        <Table.Th
                            key={col.key}
                            onClick={sortable ? () => handleSort(col.key) : undefined}
                            style={sortable ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                        >
                            <Group gap={4} wrap="nowrap">
                                <Text size="sm" fw={600}>{col.label}</Text>
                                <SortIcon colKey={col.key} />
                            </Group>
                        </Table.Th>
                    ))}
                    {deleteEntry && <Table.Th style={{ width: 40 }}>Actions</Table.Th>}
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {pageRows.length === 0 ? (
                    <Table.Tr>
                        <Table.Td colSpan={allColumns.length + (deleteEntry ? 1 : 0)}>
                            <Text ta="center" c="dimmed" size="sm">No entries found.</Text>
                        </Table.Td>
                    </Table.Tr>
                ) : pageRows.map((row, idx) => (
                    <Table.Tr key={String(row['record_id'] ?? idx)}>
                        {allColumns.map(col => (
                            <Table.Td key={col.key}>
                                <Text size="sm">{String(row[col.key] ?? '')}</Text>
                            </Table.Td>
                        ))}
                        {deleteEntry && (
                            <Table.Td>
                                {canDelete(row) && (
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        size="sm"
                                        aria-label={`Delete record ${row['record_id']}`}
                                        onClick={() => setDeleteTarget({ record_id: Number(row['record_id']) })}
                                    >
                                        <IconTrash size={14} />
                                    </ActionIcon>
                                )}
                            </Table.Td>
                        )}
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </>
    );

    return (
        <div className={cssClass} {...styleProps}>
            {csvExport && (
                <Group justify="flex-end" mb="xs">
                    <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconDownload size={14} />}
                        onClick={handleExportCsv}
                        disabled={sorted.length === 0}
                    >
                        Export CSV
                    </Button>
                </Group>
            )}
            {searching && (
                <TextInput
                    leftSection={<IconSearch size={16} />}
                    placeholder="Search…"
                    value={search}
                    onChange={e => { setSearch(e.currentTarget.value); setPage(1); }}
                    mb="sm"
                    aria-label="Search entries"
                />
            )}

            {stickyHeader ? (
                <Table.ScrollContainer minWidth={500}>
                    <Table
                        horizontalSpacing={spacing}
                        verticalSpacing={spacing}
                        striped={striped}
                        highlightOnHover={highlightOnHover}
                        withTableBorder={withTableBorder}
                        withColumnBorders={withColumnBorders}
                        withRowBorders={withRowBorders}
                        stickyHeader
                        captionSide={captionSide}
                    >
                        {tableContent}
                    </Table>
                </Table.ScrollContainer>
            ) : (
                <ScrollArea type="auto">
                    <Table
                        horizontalSpacing={spacing}
                        verticalSpacing={spacing}
                        striped={striped}
                        highlightOnHover={highlightOnHover}
                        withTableBorder={withTableBorder}
                        withColumnBorders={withColumnBorders}
                        withRowBorders={withRowBorders}
                        captionSide={captionSide}
                    >
                        {tableContent}
                    </Table>
                </ScrollArea>
            )}

            {(info || paginate) && (
                <Group justify="space-between" mt="sm">
                    {info && sorted.length > 0 && (
                        <Text size="xs" c="dimmed">
                            Showing {startEntry}–{endEntry} of {sorted.length} entries
                        </Text>
                    )}
                    {paginate && totalPages > 1 && (
                        <Pagination
                            value={page}
                            onChange={setPage}
                            total={totalPages}
                            size="sm"
                        />
                    )}
                </Group>
            )}

            <Modal
                opened={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                title={style.delete_modal_title?.content || 'Delete entry'}
                centered
                size="sm"
            >
                <Stack gap="md">
                    <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                        {style.delete_modal_body?.content || 'This action cannot be undone.'}
                    </Alert>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button
                            color="red"
                            loading={deleteMutation.isPending}
                            onClick={handleDeleteConfirm}
                        >
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    );
};

export default ShowUserInputStyle;
