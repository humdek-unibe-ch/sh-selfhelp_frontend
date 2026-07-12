/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import type { IDataTableColumn } from '../../../../../types/responses/admin/data.types';

export interface IColumnSelectOption {
    value: string;
    label: string;
}

/**
 * Build deduplicated column picker options with both display label and field key.
 */
export function buildColumnSelectOptions(columns: IDataTableColumn[]): IColumnSelectOption[] {
    const seen = new Set<string>();
    const options: IColumnSelectOption[] = [];

    for (const column of columns) {
        const fieldKey = column.fieldKey?.trim() ?? '';
        if (fieldKey === '' || seen.has(fieldKey)) {
            continue;
        }
        seen.add(fieldKey);

        const displayLabel = column.displayName?.trim() || fieldKey;
        const standardSuffix = column.standard ? ' (standard)' : '';
        const label = displayLabel === fieldKey
            ? `${fieldKey}${standardSuffix}`
            : `${displayLabel} - ${fieldKey}${standardSuffix}`;

        options.push({ value: fieldKey, label });
    }

    return options;
}

/**
 * Keep stale selected keys visible when the column list no longer contains them.
 */
export function withMissingColumnOptions(
    options: IColumnSelectOption[],
    selectedKeys: string[],
): IColumnSelectOption[] {
    const next = [...options];
    const known = new Set(options.map((option) => option.value));

    for (const key of selectedKeys) {
        const trimmed = key.trim();
        if (trimmed === '' || known.has(trimmed)) {
            continue;
        }
        next.push({
            value: trimmed,
            label: `${trimmed} (missing column)`,
        });
    }

    return next;
}
