/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Stack, Text } from '@mantine/core';
import type { IFormListColumn, IFormListSelected } from '../../../../../shared';
import { cellOf, formatEntryDate } from '../../../../../utils/form-list.utils';
import { FormListCell } from './FormListCell';
import styles from './FormList.module.css';

interface IFormListRecordViewProps {
    columns: readonly IFormListColumn[];
    selected: IFormListSelected;
}

/** One record, read-only: each configured column as a label and its value. */
export function FormListRecordView({ columns, selected }: IFormListRecordViewProps) {
    return (
        <Stack gap="sm" component="dl" style={{ margin: 0 }} data-testid="form-list-record-view">
            {columns.map((column) => (
                <div key={column.field}>
                    <Text component="dt" size="xs" c="dimmed" className={styles.cardLabel}>{column.label}</Text>
                    <Text component="dd" size="sm" style={{ margin: 0 }} className={styles.cell}>
                        <FormListCell value={cellOf(selected.values, column)} column={column} />
                    </Text>
                </div>
            ))}
            <div>
                <Text component="dt" size="xs" c="dimmed">Entry date</Text>
                <Text component="dd" size="sm" style={{ margin: 0 }}>{formatEntryDate(selected.entry_date)}</Text>
            </div>
        </Stack>
    );
}
