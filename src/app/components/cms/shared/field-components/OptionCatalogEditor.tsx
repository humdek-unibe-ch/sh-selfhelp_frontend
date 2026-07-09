/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Group,
    Paper,
    Stack,
    Switch,
    Text,
    TextInput,
} from '@mantine/core';
import {
    IconArrowDown,
    IconArrowUp,
    IconGripVertical,
    IconPlus,
    IconTrash,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { LocaleTabBadges } from '../locale-tabs/LocaleTabBadges';
import {
    type IOptionEditorIssue,
    type IOptionEditorLanguage,
    type IOptionEditorRow,
    orderOptionEditorRows,
    parseOptionEditorRows,
    serializeOptionEditorLabels,
    serializeOptionEditorRows,
    validateOptionEditorRows,
    validateSerializedOptionConfiguration,
} from './option-catalog-editor.utils';

interface IOptionCatalogEditorProps {
    catalogValue: string;
    labelValues: Record<number, string>;
    languages: IOptionEditorLanguage[];
    onCatalogChange: (value: string) => void;
    onLabelChange: (languageId: number, value: string) => void;
    disabled?: boolean;
}

function issueFor(
    issues: IOptionEditorIssue[],
    rowIndex: number,
    field: IOptionEditorIssue['field'],
    languageId?: number,
): string | undefined {
    return issues.find((issue) =>
        issue.rowIndex === rowIndex
        && issue.field === field
        && issue.languageId === languageId
    )?.message;
}

function moveRow(rows: IOptionEditorRow[], fromIndex: number, toIndex: number): IOptionEditorRow[] {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= rows.length || toIndex >= rows.length) {
        return rows;
    }
    const next = [...rows];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    return next;
}

export function OptionCatalogEditor({
    catalogValue,
    labelValues,
    languages,
    onCatalogChange,
    onLabelChange,
    disabled = false,
}: IOptionCatalogEditorProps): React.ReactElement {
    const parsedRows = useMemo(
        () => parseOptionEditorRows(catalogValue, labelValues, languages),
        [catalogValue, labelValues, languages],
    );
    const [rows, setRows] = useState<IOptionEditorRow[]>(parsedRows);
    const [prevCatalogValue, setPrevCatalogValue] = useState(catalogValue);
    const [prevLabelValues, setPrevLabelValues] = useState(labelValues);
    const [activeLanguageId, setActiveLanguageId] = useState(() => String(languages[0]?.id ?? ''));
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const languageKey = languages.map((language) => language.id).join(',');
    const [prevLanguageKey, setPrevLanguageKey] = useState(languageKey);
    if (prevCatalogValue !== catalogValue || prevLabelValues !== labelValues) {
        setPrevCatalogValue(catalogValue);
        setPrevLabelValues(labelValues);
        setRows(parsedRows);
    }
    if (prevLanguageKey !== languageKey && languages.length > 0) {
        setPrevLanguageKey(languageKey);
        const stillValid = languages.some((language) => String(language.id) === activeLanguageId);
        if (!stillValid) {
            setActiveLanguageId(String(languages[0].id));
        }
    }

    const activeLanguage = languages.find((language) => String(language.id) === activeLanguageId)
        ?? languages[0];
    const activeLanguageNumericId = activeLanguage?.id ?? languages[0]?.id ?? 0;

    const sourceIssues = validateSerializedOptionConfiguration(catalogValue, labelValues, languages)
        .filter((issue) => issue.rowIndex < 0);
    const rowIssues = validateOptionEditorRows(rows, languages);
    const issues = [...sourceIssues, ...rowIssues];

    const localeLanguages = languages.map((language) => ({
        id: language.id,
        language: language.language,
        locale: language.locale,
        hasTranslation: rows.some((row) => (row.labels[language.id] ?? '').trim() !== ''),
    }));

    const commit = (nextRows: IOptionEditorRow[]): void => {
        const ordered = orderOptionEditorRows(nextRows);
        setRows(ordered);
        onCatalogChange(serializeOptionEditorRows(ordered));
        for (const language of languages) {
            onLabelChange(
                language.id,
                serializeOptionEditorLabels(ordered, language.id),
            );
        }
    };

    const updateRow = (rowIndex: number, update: Partial<IOptionEditorRow>): void => {
        commit(rows.map((row, index) => index === rowIndex ? { ...row, ...update } : row));
    };

    const updateActiveLabel = (rowIndex: number, label: string): void => {
        if (!activeLanguage) {
            return;
        }
        const row = rows[rowIndex];
        if (!row) {
            return;
        }
        updateRow(rowIndex, {
            labels: {
                ...row.labels,
                [activeLanguage.id]: label,
            },
        });
    };

    const addRow = (): void => {
        commit([
            ...rows,
            {
                value: '',
                sort: String(rows.length + 1),
                disabled: false,
                labels: Object.fromEntries(languages.map((language) => [language.id, ''])),
            },
        ]);
    };

    const handleMove = (fromIndex: number, toIndex: number): void => {
        commit(moveRow(rows, fromIndex, toIndex));
    };

    return (
        <Stack gap="sm">
            {issues.length > 0 ? (
                <Alert color="red" title="Fix option errors" role="alert" p="xs">
                    <Stack gap={2}>
                        {issues.slice(0, 4).map((issue, index) => (
                            <Text size="xs" key={`${issue.rowIndex}-${issue.field}-${issue.languageId ?? 0}-${index}`}>
                                {issue.message}
                            </Text>
                        ))}
                        {issues.length > 4 ? (
                            <Text size="xs" c="dimmed">{issues.length - 4} more…</Text>
                        ) : null}
                    </Stack>
                </Alert>
            ) : null}

            {rows.length > 0 && languages.length > 1 ? (
                <Group justify="flex-end">
                    <LocaleTabBadges
                        languages={localeLanguages}
                        activeLanguageId={activeLanguageId}
                        onActiveLanguageChange={setActiveLanguageId}
                    />
                </Group>
            ) : null}

            {rows.length === 0 ? (
                <Text size="sm" c="dimmed">No options yet. Add the first choice below.</Text>
            ) : (
                <Stack gap="xs">
                    {rows.map((row, rowIndex) => (
                        <Paper
                            key={`${rowIndex}-${row.value}`}
                            withBorder
                            p="sm"
                            radius="md"
                            draggable={!disabled}
                            onDragStart={() => setDraggedIndex(rowIndex)}
                            onDragOver={(event) => {
                                event.preventDefault();
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                if (draggedIndex !== null && draggedIndex !== rowIndex) {
                                    handleMove(draggedIndex, rowIndex);
                                }
                                setDraggedIndex(null);
                            }}
                            onDragEnd={() => setDraggedIndex(null)}
                            style={{
                                opacity: draggedIndex === rowIndex ? 0.65 : 1,
                                cursor: disabled ? 'default' : 'grab',
                            }}
                        >
                            <Group justify="space-between" mb="xs" wrap="nowrap">
                                <Group gap={4} wrap="nowrap">
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        aria-label={`Drag option ${rowIndex + 1}`}
                                        style={{ cursor: disabled ? 'default' : 'grab' }}
                                        disabled={disabled}
                                    >
                                        <IconGripVertical size={15} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="subtle"
                                        size="sm"
                                        aria-label={`Move option ${rowIndex + 1} up`}
                                        disabled={disabled || rowIndex === 0}
                                        onClick={() => handleMove(rowIndex, rowIndex - 1)}
                                    >
                                        <IconArrowUp size={15} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="subtle"
                                        size="sm"
                                        aria-label={`Move option ${rowIndex + 1} down`}
                                        disabled={disabled || rowIndex === rows.length - 1}
                                        onClick={() => handleMove(rowIndex, rowIndex + 1)}
                                    >
                                        <IconArrowDown size={15} />
                                    </ActionIcon>
                                    <Text size="sm" fw={600}>Option {rowIndex + 1}</Text>
                                    {row.disabled ? <Badge size="xs" color="gray">Disabled</Badge> : null}
                                </Group>
                                <Group gap="xs" wrap="nowrap">
                                    <Switch
                                        size="xs"
                                        label="Disabled"
                                        checked={row.disabled}
                                        onChange={(event) => updateRow(rowIndex, { disabled: event.currentTarget.checked })}
                                        disabled={disabled}
                                        aria-label={`Disable option ${rowIndex + 1}`}
                                    />
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        size="sm"
                                        onClick={() => commit(rows.filter((_, index) => index !== rowIndex))}
                                        disabled={disabled}
                                        aria-label={`Remove option ${rowIndex + 1}`}
                                    >
                                        <IconTrash size={15} />
                                    </ActionIcon>
                                </Group>
                            </Group>

                            <TextInput
                                label="Code"
                                description="Stored value (language-neutral)"
                                value={row.value}
                                onChange={(event) => updateRow(rowIndex, { value: event.currentTarget.value })}
                                error={issueFor(rowIssues, rowIndex, 'value')}
                                disabled={disabled}
                                aria-label={`Option ${rowIndex + 1} code`}
                                placeholder="e.g. release"
                                size="sm"
                                mb="xs"
                            />

                            <Group justify="space-between" align="flex-end" mb={4} wrap="nowrap">
                                <Text size="sm" fw={500}>Label</Text>
                                {languages.length === 1 && activeLanguage?.locale ? (
                                    <Badge size="xs" variant="light" color="gray">{activeLanguage.locale}</Badge>
                                ) : null}
                            </Group>
                            <TextInput
                                value={row.labels[activeLanguageNumericId] ?? ''}
                                onChange={(event) => updateActiveLabel(rowIndex, event.currentTarget.value)}
                                error={issueFor(rowIssues, rowIndex, 'label', activeLanguageNumericId)}
                                disabled={disabled}
                                aria-label={`Option ${rowIndex + 1} label for ${activeLanguage?.language ?? 'language'}`}
                                placeholder={activeLanguage
                                    ? `Label in ${activeLanguage.language}`
                                    : 'Display label'}
                                size="sm"
                            />
                        </Paper>
                    ))}
                </Stack>
            )}

            <Button
                variant="light"
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={addRow}
                disabled={disabled}
                style={{ alignSelf: 'flex-start' }}
            >
                Add option
            </Button>
        </Stack>
    );
}
