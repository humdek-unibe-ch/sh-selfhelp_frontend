/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

export interface IOptionEditorLanguage {
    id: number;
    language: string;
    locale?: string;
}

export interface IOptionEditorRow {
    value: string;
    sort: string;
    disabled: boolean;
    meta?: Record<string, unknown>;
    labels: Record<number, string>;
}

export interface IOptionEditorIssue {
    rowIndex: number;
    field: 'value' | 'sort' | 'label';
    message: string;
    languageId?: number;
}

const OPTION_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function parseJson(raw: string): unknown {
    if (raw.trim() === '') {
        return null;
    }
    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return null;
    }
}

function parseLabelMap(raw: string | undefined): Record<string, string> {
    const parsed = parseJson(raw ?? '');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
    }

    const labels: Record<string, string> = {};
    for (const [code, label] of Object.entries(parsed)) {
        if (typeof label === 'string') {
            labels[code] = label;
        }
    }
    return labels;
}

export function parseOptionEditorRows(
    catalogRaw: string,
    labelValues: Record<number, string>,
    languages: IOptionEditorLanguage[],
): IOptionEditorRow[] {
    const parsed = parseJson(catalogRaw);
    if (!Array.isArray(parsed)) {
        return [];
    }

    const labelsByLanguage = new Map(
        languages.map((language) => [language.id, parseLabelMap(labelValues[language.id])]),
    );

    return parsed.map((item) => {
        const entry = item && typeof item === 'object' && !Array.isArray(item)
            ? item as Record<string, unknown>
            : {};
        const value = typeof entry.value === 'string' ? entry.value : '';
        const legacyLabel = typeof entry.label === 'string'
            ? entry.label
            : (typeof entry.text === 'string' ? entry.text : '');
        const explicitMeta = entry.meta
            && typeof entry.meta === 'object'
            && !Array.isArray(entry.meta)
            ? entry.meta as Record<string, unknown>
            : {};
        const meta = typeof entry.description === 'string'
            && entry.description.trim() !== ''
            && explicitMeta.description === undefined
            ? { ...explicitMeta, description: entry.description.trim() }
            : explicitMeta;
        const labels: Record<number, string> = {};
        for (const language of languages) {
            labels[language.id] = labelsByLanguage.get(language.id)?.[value] ?? legacyLabel;
        }

        return {
            value,
            sort: typeof entry.sort === 'number' ? String(entry.sort) : '',
            disabled: entry.disabled === true,
            ...(Object.keys(meta).length > 0 ? { meta } : {}),
            labels,
        };
    });
}

export function validateOptionEditorRows(
    rows: IOptionEditorRow[],
    languages: IOptionEditorLanguage[],
): IOptionEditorIssue[] {
    const issues: IOptionEditorIssue[] = [];
    const firstRowByCode = new Map<string, number>();

    rows.forEach((row, rowIndex) => {
        const code = row.value.trim();
        if (code === '') {
            issues.push({
                rowIndex,
                field: 'value',
                message: `Row ${rowIndex + 1}: code is required.`,
            });
        } else if (!OPTION_CODE_PATTERN.test(code)) {
            issues.push({
                rowIndex,
                field: 'value',
                message: `Row ${rowIndex + 1}: code "${row.value}" may contain only letters, numbers, dot, underscore, and hyphen.`,
            });
        } else         if (firstRowByCode.has(code)) {
            issues.push({
                rowIndex,
                field: 'value',
                message: `Row ${rowIndex + 1}: code "${code}" duplicates row ${(firstRowByCode.get(code) ?? 0) + 1}.`,
            });
        } else {
            firstRowByCode.set(code, rowIndex);
        }

        for (const language of languages) {
            if ((row.labels[language.id] ?? '').trim() === '') {
                issues.push({
                    rowIndex,
                    field: 'label',
                    languageId: language.id,
                    message: `Row ${rowIndex + 1}, ${language.language}${language.locale ? ` (${language.locale})` : ''}: label is required.`,
                });
            }
        }
    });

    return issues;
}

export function validateSerializedOptionConfiguration(
    catalogRaw: string,
    labelValues: Record<number, string>,
    languages: IOptionEditorLanguage[],
): IOptionEditorIssue[] {
    const issues: IOptionEditorIssue[] = [];
    const catalog = parseJson(catalogRaw);
    if (catalogRaw.trim() !== '' && !Array.isArray(catalog)) {
        issues.push({
            rowIndex: -1,
            field: 'value',
            message: 'Options must be a valid JSON array.',
        });
        return issues;
    }

    for (const language of languages) {
        const raw = labelValues[language.id] ?? '';
        const labels = parseJson(raw);
        if (raw.trim() !== '' && (!labels || typeof labels !== 'object' || Array.isArray(labels))) {
            issues.push({
                rowIndex: -1,
                field: 'label',
                languageId: language.id,
                message: `${language.language}${language.locale ? ` (${language.locale})` : ''}: option labels must be a valid JSON object.`,
            });
        }
    }

    return [
        ...issues,
        ...validateOptionEditorRows(
            parseOptionEditorRows(catalogRaw, labelValues, languages),
            languages,
        ),
    ];
}

export function serializeOptionEditorRows(rows: IOptionEditorRow[]): string {
    return JSON.stringify(rows.map((row, index) => ({
        value: row.value.trim(),
        sort: index + 1,
        ...(row.disabled ? { disabled: true } : {}),
        ...(row.meta && Object.keys(row.meta).length > 0 ? { meta: row.meta } : {}),
    })), null, 2);
}

/** Keep row order and assign sequential sort values before persisting. */
export function orderOptionEditorRows(rows: IOptionEditorRow[]): IOptionEditorRow[] {
    return rows.map((row, index) => ({
        ...row,
        sort: String(index + 1),
    }));
}

export function serializeOptionEditorLabels(
    rows: IOptionEditorRow[],
    languageId: number,
): string {
    const labels: Record<string, string> = {};
    for (const row of rows) {
        const code = row.value.trim();
        const label = (row.labels[languageId] ?? '').trim();
        if (code !== '' && label !== '') {
            labels[code] = label;
        }
    }
    return JSON.stringify(labels, null, 2);
}
