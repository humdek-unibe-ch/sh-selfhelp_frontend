/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import type { ReactNode } from 'react';
import { Card, SimpleGrid, Stack, Table, Text, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconArrowsSort } from '@tabler/icons-react';
import type { IFormListColumn, IFormListRow, IFormListState } from '../../../../../shared';
import { cellOf, rowLabel } from '../../../../../utils/form-list.utils';
import BasicStyle from '../BasicStyle';
import { FormListCell } from './FormListCell';
import { FORM_LIST_TEXT } from './form-list.constants';
import styles from './FormList.module.css';

interface IRowsBaseProps {
    state: IFormListState;
    /** The actions of one row, or null when the row has none. */
    renderActions: (row: IFormListRow, label: string) => ReactNode;
    /** True when at least one row has actions (decides whether the actions column exists). */
    hasActions: boolean;
    /** A read is in flight behind the rows that are shown. */
    busy: boolean;
}

interface IFormListTableProps extends IRowsBaseProps {
    /** A column header was clicked: sort by this field. */
    onSort: (field: string) => void;
    /** The accessible name of the table. */
    caption: string;
}

function ariaSortOf(column: IFormListColumn, state: IFormListState): 'ascending' | 'descending' | 'none' | undefined {
    if (!column.sortable) {
        return undefined;
    }
    const first = state.state.sort[0];
    if (first === undefined || first.field !== column.field) {
        return 'none';
    }
    return first.direction === 'asc' ? 'ascending' : 'descending';
}

/**
 * The rows as a table. It scrolls sideways inside its own box when it is
 * wider than the screen, so the page itself never gets a horizontal scrollbar.
 */
export function FormListTable({ state, renderActions, hasActions, busy, onSort, caption }: IFormListTableProps) {
    return (
        <Table.ScrollContainer minWidth={Math.min(320 + state.columns.length * 120, 960)} type="native" className={styles.scroller}>
            <Table
                striped
                highlightOnHover
                withTableBorder
                verticalSpacing="xs"
                aria-busy={busy}
                data-testid="form-list-table"
            >
                <VisuallyHidden component="caption">{caption}</VisuallyHidden>
                <Table.Thead>
                    <Table.Tr>
                        {state.columns.map((column) => {
                            const sort = ariaSortOf(column, state);
                            const first = state.state.sort[0];
                            const active = first !== undefined && first.field === column.field;
                            return (
                                <Table.Th key={column.field} aria-sort={sort} className={styles.cell}>
                                    {column.sortable ? (
                                        <UnstyledButton
                                            className={styles.headButton}
                                            onClick={() => onSort(column.field)}
                                            aria-label={`${FORM_LIST_TEXT.sortBy} ${column.label}`}
                                        >
                                            <span>{column.label}</span>
                                            {active
                                                ? (first.direction === 'asc'
                                                    ? <IconArrowUp size={14} aria-hidden="true" />
                                                    : <IconArrowDown size={14} aria-hidden="true" />)
                                                : <IconArrowsSort size={14} aria-hidden="true" />}
                                        </UnstyledButton>
                                    ) : (
                                        column.label
                                    )}
                                </Table.Th>
                            );
                        })}
                        {hasActions && (
                            <Table.Th>
                                <VisuallyHidden>Actions</VisuallyHidden>
                            </Table.Th>
                        )}
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {state.rows.map((row) => {
                        const label = rowLabel(row, state.columns);
                        return (
                            <Table.Tr key={row.record_id} data-record-id={row.record_id}>
                                {state.columns.map((column) => (
                                    <Table.Td key={column.field} className={styles.cell}>
                                        <FormListCell value={cellOf(row.values, column)} column={column} />
                                    </Table.Td>
                                ))}
                                {hasActions && (
                                    <Table.Td>
                                        <div className={styles.actions}>{renderActions(row, label)}</div>
                                    </Table.Td>
                                )}
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
}

/**
 * The rows drawn from the author's row template (a data view with the layout `custom`).
 * The server rendered the template once per record into `row.sections`: tokens, translations
 * and conditions are already resolved, so each record is just its sections. The element that
 * holds the records takes the author's `row_css` (for example a grid); without it the records
 * stand one below the other.
 */
export function FormListCustom({ state, busy }: Pick<IRowsBaseProps, 'state' | 'busy'>) {
    const rowCss = state.list.row_css.trim();
    return (
        <div
            className={rowCss === '' ? styles.customStack : `${styles.customHolder} ${rowCss}`}
            aria-busy={busy}
            data-testid="form-list-custom"
        >
            {state.rows.map((row) => (
                <div key={row.record_id} className={styles.customRow} data-record-id={row.record_id}>
                    {(row.sections ?? []).map((section) => (
                        <BasicStyle key={section.id} style={section} />
                    ))}
                </div>
            ))}
        </div>
    );
}

/** The rows as cards: one card per record, label above value. */
export function FormListCards({ state, renderActions, hasActions, busy }: IRowsBaseProps) {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm" aria-busy={busy} data-testid="form-list-cards">
            {state.rows.map((row) => {
                const label = rowLabel(row, state.columns);
                return (
                    <Card key={row.record_id} withBorder padding="sm" data-record-id={row.record_id}>
                        <Stack gap="xs">
                            {state.columns.map((column) => (
                                <div key={column.field}>
                                    <Text size="xs" c="dimmed" className={styles.cardLabel}>{column.label}</Text>
                                    <Text size="sm" className={styles.cell} component="div">
                                        <FormListCell value={cellOf(row.values, column)} column={column} />
                                    </Text>
                                </div>
                            ))}
                            {hasActions && <div className={styles.actions}>{renderActions(row, label)}</div>}
                        </Stack>
                    </Card>
                );
            })}
        </SimpleGrid>
    );
}
