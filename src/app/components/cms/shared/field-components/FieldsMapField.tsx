/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    ActionIcon,
    Button,
    Group,
    Loader,
    Paper,
    Select,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';
import { useTableColumns } from '../../../../../hooks/useData';
import { useResolvedDataTableName } from './useResolvedDataTableName';
import {
    parseFieldsMapCatalog,
    parseFieldsMapLabels,
    serializeFieldsMapCatalog,
    serializeFieldsMapLabels,
} from './fields-map.utils';
import { buildColumnSelectOptions, withMissingColumnOptions } from './column-option.utils';
import { LocaleTabBadges, type ILocaleTabLanguage } from '../locale-tabs/LocaleTabBadges';

interface IFieldsMapEditorLanguage {
    id: number;
    language: string;
    locale?: string;
}

interface IFieldsMapFieldProps {
    catalogValue: string;
    labelValues: Record<number, string>;
    languages: IFieldsMapEditorLanguage[];
    onCatalogChange: (value: string) => void;
    onLabelChange: (languageId: number, value: string) => void;
    disabled?: boolean;
}

function moveKey(keys: string[], fromIndex: number, toIndex: number): string[] {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= keys.length || toIndex >= keys.length) {
        return keys;
    }
    const next = [...keys];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    return next;
}

export function FieldsMapField({
    catalogValue,
    labelValues,
    languages,
    onCatalogChange,
    onLabelChange,
    disabled = false,
}: IFieldsMapFieldProps) {
    const { tableName, isLoading: isTablesLoading, needsDataTable } = useResolvedDataTableName();
    const { data: columnsResp, isLoading: isColumnsLoading } = useTableColumns(tableName);

    const fieldKeys = useMemo(() => parseFieldsMapCatalog(catalogValue), [catalogValue]);
    const [activeLanguageId, setActiveLanguageId] = useState(() => String(languages[0]?.id ?? ''));

    const columnOptions = useMemo(() => {
        const base = buildColumnSelectOptions(columnsResp?.columns ?? []);
        return withMissingColumnOptions(base, fieldKeys);
    }, [columnsResp?.columns, fieldKeys]);

    const activeLanguage = languages.find((language) => String(language.id) === activeLanguageId) ?? languages[0];
    const activeLanguageIdNumber = activeLanguage?.id ?? languages[0]?.id ?? 1;

    const labelMap = useMemo(
        () => parseFieldsMapLabels(labelValues[activeLanguageIdNumber] ?? ''),
        [labelValues, activeLanguageIdNumber],
    );

    const commitCatalog = useCallback((nextKeys: string[]) => {
        onCatalogChange(serializeFieldsMapCatalog(nextKeys));
    }, [onCatalogChange]);

    const updateLabelForKey = useCallback((fieldKey: string, label: string, baseMap: Record<string, string>) => {
        const next = { ...baseMap, [fieldKey]: label };
        if (label.trim() === '') {
            delete next[fieldKey];
        }
        onLabelChange(activeLanguageIdNumber, serializeFieldsMapLabels(next));
    }, [activeLanguageIdNumber, onLabelChange]);

    const addRow = useCallback(() => {
        const firstUnused = columnOptions.find((option) => !fieldKeys.includes(option.value));
        if (!firstUnused) {
            return;
        }
        commitCatalog([...fieldKeys, firstUnused.value]);
        updateLabelForKey(firstUnused.value, firstUnused.label, labelMap);
    }, [columnOptions, commitCatalog, fieldKeys, labelMap, updateLabelForKey]);

    const isLoading = isTablesLoading || (Boolean(tableName) && isColumnsLoading);

    if (needsDataTable) {
        return (
            <Text size="sm" c="dimmed">
                Select a data table first to map columns and labels.
            </Text>
        );
    }

    if (isLoading) {
        return <Loader size="sm" />;
    }

    const localeLanguages: ILocaleTabLanguage[] = languages.map((language) => ({
        id: language.id,
        language: language.language,
        locale: language.locale,
        hasTranslation: (labelValues[language.id] ?? '').trim() !== '',
    }));

    return (
        <Stack gap="sm">
            {languages.length > 1 && (
                <LocaleTabBadges
                    languages={localeLanguages}
                    activeLanguageId={activeLanguageId}
                    onActiveLanguageChange={setActiveLanguageId}
                />
            )}
            {fieldKeys.length === 0 ? (
                <Text size="sm" c="dimmed">
                    No column overrides - all columns use their default display names.
                </Text>
            ) : (
                fieldKeys.map((fieldKey, index) => (
                    <Paper key={`${fieldKey}-${index}`} withBorder p="sm" radius="md">
                        <Group align="flex-end" wrap="nowrap" gap="sm">
                            <Select
                                label="Column"
                                data={columnOptions}
                                value={fieldKey || null}
                                onChange={(next) => {
                                    if (!next) {
                                        return;
                                    }
                                    const selected = columnOptions.find((option) => option.value === next);
                                    const nextKeys = [...fieldKeys];
                                    nextKeys[index] = next;
                                    commitCatalog(nextKeys);
                                    if (selected && !(labelMap[fieldKey] ?? '').trim()) {
                                        updateLabelForKey(next, selected.label, labelMap);
                                    }
                                }}
                                placeholder="Select column"
                                searchable
                                disabled={disabled}
                                style={{ flex: 1 }}
                            />
                            <TextInput
                                label="Header label"
                                value={labelMap[fieldKey] ?? ''}
                                onChange={(event) => updateLabelForKey(fieldKey, event.currentTarget.value, labelMap)}
                                placeholder="Display name"
                                disabled={disabled}
                                style={{ flex: 1 }}
                            />
                            <Group gap={4} mb={4}>
                                <ActionIcon
                                    variant="subtle"
                                    aria-label="Move column up"
                                    disabled={disabled || index === 0}
                                    onClick={() => commitCatalog(moveKey(fieldKeys, index, index - 1))}
                                >
                                    <IconArrowUp size={16} />
                                </ActionIcon>
                                <ActionIcon
                                    variant="subtle"
                                    aria-label="Move column down"
                                    disabled={disabled || index === fieldKeys.length - 1}
                                    onClick={() => commitCatalog(moveKey(fieldKeys, index, index + 1))}
                                >
                                    <IconArrowDown size={16} />
                                </ActionIcon>
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    aria-label="Remove column mapping"
                                    disabled={disabled}
                                    onClick={() => commitCatalog(fieldKeys.filter((_, rowIndex) => rowIndex !== index))}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Group>
                        </Group>
                    </Paper>
                ))
            )}
            <Button
                variant="light"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={addRow}
                disabled={disabled || columnOptions.length === 0}
            >
                Add column
            </Button>
        </Stack>
    );
}
