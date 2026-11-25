/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * What is wrong with the configuration of an entry list, as the server tells an
 * author who saves it: `400` with `data.reason = invalid_list_config` and
 * `data.errors = [{ field, message }]`. Nothing is stored when it happens.
 */
export interface IFormListConfigProblem {
    /** The section field that holds the problem (`list_columns`, `quick_actions`, ...). */
    field: string;
    message: string;
}

interface IProblemEnvelope {
    response?: {
        status?: number;
        data?: { data?: unknown } | null;
    } | null;
}

/** The problems of a refused list save, or an empty list for any other error. */
export function getFormListConfigProblems(error: unknown): IFormListConfigProblem[] {
    const response = (error as IProblemEnvelope | null | undefined)?.response;
    const data = response?.data?.data;
    if (response?.status !== 400 || typeof data !== 'object' || data === null) {
        return [];
    }
    const record = data as { reason?: unknown; errors?: unknown };
    if (record.reason !== 'invalid_list_config' || !Array.isArray(record.errors)) {
        return [];
    }

    const problems: IFormListConfigProblem[] = [];
    for (const entry of record.errors) {
        if (typeof entry === 'object' && entry !== null) {
            const { field, message } = entry as { field?: unknown; message?: unknown };
            if (typeof field === 'string' && typeof message === 'string') {
                problems.push({ field, message });
            }
        }
    }

    return problems;
}

/** Readable names of the fields a problem can name. */
const FIELD_LABELS: Readonly<Record<string, string>> = {
    list_key: 'List key',
    data_table: 'Data table',
    list_layout: 'Layout',
    list_row_css: 'Record container classes',
    form_presentation: 'Form presentation',
    page_size: 'Page size',
    list_columns: 'Columns',
    list_sort: 'Order',
    list_controls: 'Controls',
    list_fixed_filter: 'Fixed filter',
    quick_actions: 'Quick actions',
    own_entries_only: 'Own entries only',
    allow_create: 'Allow add',
    allow_update: 'Allow edit',
    allow_delete: 'Allow delete',
    show_history: 'Show history',
    detail_url: 'Detail URL',
    children: 'Children',
};

export function formListFieldLabel(field: string): string {
    return FIELD_LABELS[field] ?? field;
}
