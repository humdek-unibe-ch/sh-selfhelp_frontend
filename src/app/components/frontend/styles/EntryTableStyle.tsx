/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useMemo, useState } from 'react';
import {
    Table, Text, TextInput, Pagination, Group, ActionIcon, Button, Alert, ScrollArea, Title, Select
} from '@mantine/core';
import { IconTrash, IconSearch, IconAlertCircle, IconChevronUp, IconChevronDown, IconSelector, IconDownload, IconPlus, IconPencil } from '@tabler/icons-react';
import { useDeleteFormMutation } from '../../../../hooks/useFormSubmission';
import { usePageContentValue } from '../../../../hooks/usePageContentValue';
import { useLanguageContext } from '../../contexts/LanguageContext';
import type { IEntryTableStyle, IEntryTableEntry } from '../../../../shared';
import { parseFieldsMapCatalog, parseFieldsMapLabels } from '@selfhelp/shared';
import { useCmsAppAdminNav } from '../../cms/cms-apps/CmsAppAdminNavContext';
import { ModalWrapper } from '../../shared/common/CustomModal/CustomModal';


interface IColumn {
    key: string;
    label: string;
}

type TSortDir = 'asc' | 'desc' | null;

interface IEntryTableStyleProps {
    style: IEntryTableStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

const PAGE_SIZE = 10;

const CMS_ADMIN_HIDDEN_KEYS = new Set([
    'user_name',
    'user_code',
    'id_actionTriggerTypes',
    'id_action_trigger_types',
    'triggerType',
    'id_users_deleted',
    'id_languages',
    'language_locale',
    'language_name',
]);

const EntryTableStyle: React.FC<IEntryTableStyleProps> = ({ style, styleProps, cssClass }) => {
    const pageContent = usePageContentValue();
    const deleteMutation = useDeleteFormMutation();
    const cmsAppNav = useCmsAppAdminNav();
    const { languages, currentLanguageId } = useLanguageContext();

    const heading = style.title?.content;
    const emptyText = style.empty_text?.content || 'No entries found.';
    const showTimestamp = style.show_timestamp?.content === '1';
    const showLanguagePreview = style.show_language_preview?.content === '1' && Boolean(cmsAppNav);

    const sortable = style.dt_sortable?.content === '1';
    const searching = style.dt_searching?.content === '1';
    const paginate = style.dt_paginate?.content === '1';
    const info = style.dt_info?.content === '1';
    const defaultOrderCol = style.dt_default_order_column?.content ?? null;
    const defaultOrderDir = (style.dt_default_order_dir?.content ?? 'asc') as 'asc' | 'desc';
    const csvExport = style.csv_export?.content === '1';
    const deleteEntry = style.delete_entry?.content === '1';
    // CMS-in-CMS controls (web-only): an "Add new" button (opens the create
    // form, typically a modal) and a per-row open/edit action. `edit_url` uses a
    // single-brace `{record_id}` placeholder substituted per row at click time
    // (NOT a backend {{...}} interpolation token).
    const addUrl = style.add_url?.content?.trim() || '';
    const editUrl = style.edit_url?.content?.trim() || '';
    const hasRowActions = deleteEntry || editUrl !== '' || Boolean(cmsAppNav);
    const spacing = style.spacing?.content || 'md';
    const striped = style.web_table_striped?.content === '1';
    const highlightOnHover = style.web_table_highlight_on_hover?.content !== '0';
    const withTableBorder = style.web_table_with_table_border?.content !== '0';
    const withColumnBorders = style.web_table_with_column_borders?.content !== '0';
    const withRowBorders = style.web_table_with_row_borders?.content === '1';
    const stickyHeader = style.web_table_sticky_header?.content === '1';
    const captionSide = (style.web_table_caption_side?.content || undefined) as 'top' | 'bottom' | undefined;

    const mappedFieldKeys = parseFieldsMapCatalog(style.fields_map?.content);
    const fieldsMapLabels = parseFieldsMapLabels(style.fields_map_labels?.content);

    const rows: IEntryTableEntry[] = style.entries ?? [];

    // Issue #56 v2: rows are keyed by the immutable `field_key`; headers default
    // to the column `display_name` from `field_labels` (so renaming a column
    // relabels the header automatically). `fields_map` stays an explicit
    // override that also selects/orders columns; each mapping resolves to a real
    // data key by `field_key` first, then by current `display_name`, so a rename
    // never breaks an existing mapping.
    const fieldLabels: Record<string, string> = style.field_labels ?? {};
    const rawDataKeys = Object.keys(rows[0] ?? {})
        .filter(k => k !== 'entry_date' && k !== 'record_id' && k !== '_can_delete' && k !== '_can_edit' && k !== 'id_users');

    const dataKeys = cmsAppNav
        ? rawDataKeys.filter((k) => !CMS_ADMIN_HIDDEN_KEYS.has(k))
        : rawDataKeys;

    const mappedCols: IColumn[] = mappedFieldKeys.length
        ? mappedFieldKeys
            .map((fieldKey) => {
                const key = dataKeys.includes(fieldKey)
                    ? fieldKey
                    : dataKeys.find((k) => fieldLabels[k] === fieldKey);
                if (!key) {
                    return null;
                }
                const label = fieldsMapLabels[key] || fieldLabels[key] || key;
                return { key, label };
            })
            .filter((c): c is IColumn => c !== null)
        : dataKeys.map((k) => ({ key: k, label: fieldsMapLabels[k] || fieldLabels[k] || k }));

    const leadingCol: IColumn = showTimestamp
        ? { key: 'entry_date', label: 'Date' }
        : { key: 'record_id', label: '#' };

    const allColumns: IColumn[] = [leadingCol, ...mappedCols];

    const [sortCol, setSortCol] = useState<string | null>(defaultOrderCol ?? null);
    const [sortDir, setSortDir] = useState<TSortDir>(defaultOrderCol ? (defaultOrderDir as TSortDir) : null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<{ record_id: number } | null>(null);

    const languageOptions = useMemo(
        () => languages
            .filter((lang) => lang.id !== 1)
            .map((lang) => ({
                value: String(lang.id),
                label: lang.locale.toUpperCase(),
            })),
        [languages],
    );

    const previewLanguageId = cmsAppNav?.previewLanguageId ?? null;
    const selectedPreviewLanguage = String(previewLanguageId ?? currentLanguageId);

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
            {rows.length > 0 && (
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
                        {hasRowActions && <Table.Th style={{ width: 88 }}>Actions</Table.Th>}
                    </Table.Tr>
                </Table.Thead>
            )}
            <Table.Tbody>
                {pageRows.length === 0 ? (
                    <Table.Tr>
                        <Table.Td colSpan={allColumns.length + (hasRowActions ? 1 : 0)}>
                            <Text ta="center" c="dimmed" size="sm">{emptyText}</Text>
                        </Table.Td>
                    </Table.Tr>
                ) : pageRows.map((row, idx) => (
                    <Table.Tr key={String(row['record_id'] ?? idx)}>
                        {allColumns.map(col => (
                            <Table.Td key={col.key}>
                                <Text size="sm">{String(row[col.key] ?? '')}</Text>
                            </Table.Td>
                        ))}
                        {hasRowActions && (
                            <Table.Td>
                                <Group gap={4} wrap="nowrap">
                                    {(cmsAppNav || editUrl) && row._can_edit !== false && (
                                        cmsAppNav ? (
                                            <ActionIcon
                                                variant="subtle"
                                                size="sm"
                                                aria-label={`Edit record ${row['record_id']}`}
                                                onClick={() => cmsAppNav.openEditForm(String(row['record_id']))}
                                            >
                                                <IconPencil size={14} />
                                            </ActionIcon>
                                        ) : (
                                            <ActionIcon
                                                component="a"
                                                href={editUrl.replace('{record_id}', String(row['record_id']))}
                                                variant="subtle"
                                                size="sm"
                                                aria-label={`Edit record ${row['record_id']}`}
                                            >
                                                <IconPencil size={14} />
                                            </ActionIcon>
                                        )
                                    )}
                                    {deleteEntry && row._can_delete && (
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
                                </Group>
                            </Table.Td>
                        )}
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </>
    );

    return (
        <div className={cssClass} {...styleProps}>
            {heading && <Title order={3} mb="sm">{heading}</Title>}
            {(showLanguagePreview || cmsAppNav || addUrl || csvExport) && (
                <Group justify="space-between" mb="xs" align="flex-end" wrap="wrap" gap="sm">
                    <Group gap="xs" wrap="wrap">
                        {(cmsAppNav || addUrl) ? (
                            cmsAppNav ? (
                                <Button
                                    size="xs"
                                    leftSection={<IconPlus size={14} />}
                                    onClick={() => cmsAppNav.openCreateForm()}
                                >
                                    Add new
                                </Button>
                            ) : (
                                <Button
                                    component="a"
                                    href={addUrl}
                                    size="xs"
                                    leftSection={<IconPlus size={14} />}
                                >
                                    Add new
                                </Button>
                            )
                        ) : null}
                    </Group>
                    <Group gap="sm" wrap="wrap" align="flex-end">
                        {showLanguagePreview && languageOptions.length > 1 && cmsAppNav && (
                            <Select
                                label="Content language"
                                description="Preview translatable columns"
                                data={languageOptions}
                                value={selectedPreviewLanguage}
                                onChange={(next) => {
                                    if (next) {
                                        cmsAppNav.setPreviewLanguageId(Number(next));
                                    }
                                }}
                                w={160}
                                size="xs"
                                aria-label="Content language"
                            />
                        )}
                        {csvExport && (
                            <Button
                                variant="light"
                                size="xs"
                                leftSection={<IconDownload size={14} />}
                                onClick={handleExportCsv}
                                disabled={sorted.length === 0}
                            >
                                Export CSV
                            </Button>
                        )}
                    </Group>
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

            <ModalWrapper
                opened={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                title={style.delete_modal_title?.content || 'Delete entry'}
                size="sm"
                scrollAreaHeight="auto"
                onCancel={() => setDeleteTarget(null)}
                onDelete={handleDeleteConfirm}
                deleteLabel="Delete"
                isLoading={deleteMutation.isPending}
            >
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {style.delete_modal_body?.content || 'This action cannot be undone.'}
                </Alert>
            </ModalWrapper>
        </div>
    );
};

export default EntryTableStyle;
