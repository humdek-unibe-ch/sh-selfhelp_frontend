/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { Badge, Group, Stack, Text, TextInput } from '@mantine/core';
import { usePublicLanguages } from '../../../../hooks/useLanguages';

export type TMenuItemLabelTranslations = Record<number, string>;

interface IMenuItemLabelTranslationsFieldProps {
    value: TMenuItemLabelTranslations;
    onChange: (value: TMenuItemLabelTranslations) => void;
    label?: string;
    description?: string;
    required?: boolean;
    placeholder?: string;
}

export function MenuItemLabelTranslationsField({
    value,
    onChange,
    label = 'Label translations',
    description,
    required = false,
    placeholder,
}: IMenuItemLabelTranslationsFieldProps): React.ReactElement {
    const { languages: languagesData } = usePublicLanguages();
    const [activeLanguage, setActiveLanguage] = useState<string>('');

    const languagesWithStatus = (languagesData ?? []).map((language) => {
        const translated = (value[language.id] ?? '').trim();

        return {
            id: language.id,
            locale: language.locale,
            language: language.language,
            hasTranslation: translated !== '',
        };
    });

    if (languagesWithStatus.length > 0 && !activeLanguage) {
        setActiveLanguage(String(languagesWithStatus[0].id));
    }

    const activeLanguageData = languagesWithStatus.find(
        (entry) => String(entry.id) === activeLanguage,
    );

    const handleChange = (nextValue: string) => {
        const languageId = Number(activeLanguage);
        if (!Number.isFinite(languageId)) {
            return;
        }
        onChange({
            ...value,
            [languageId]: nextValue,
        });
    };

    const missingCount = languagesWithStatus.filter((entry) => !entry.hasTranslation).length;

    return (
        <Stack gap="xs">
            <Group justify="space-between" align="flex-end" wrap="wrap">
                <div>
                    <Text size="sm" fw={500}>
                        {label}
                        {required ? <Text span c="red"> *</Text> : null}
                    </Text>
                    {description ? (
                        <Text size="xs" c="dimmed">{description}</Text>
                    ) : null}
                </div>
                <Group gap={4}>
                    {languagesWithStatus.map((language) => (
                        <Badge
                            key={language.id}
                            size="xs"
                            variant={activeLanguage === String(language.id)
                                ? 'filled'
                                : language.hasTranslation
                                    ? 'light'
                                    : 'outline'}
                            color={activeLanguage === String(language.id)
                                ? 'blue'
                                : language.hasTranslation
                                    ? 'green'
                                    : 'gray'}
                            style={{ cursor: 'pointer', minWidth: 24, textAlign: 'center' }}
                            onClick={() => setActiveLanguage(String(language.id))}
                        >
                            {language.locale}
                        </Badge>
                    ))}
                </Group>
            </Group>

            {activeLanguageData ? (
                <TextInput
                    value={value[activeLanguageData.id] ?? ''}
                    onChange={(event) => handleChange(event.currentTarget.value)}
                    placeholder={
                        placeholder
                        ?? `Enter label for ${activeLanguageData.language}`
                    }
                    required={required}
                />
            ) : null}

            {required && missingCount > 0 ? (
                <Text size="xs" c="orange">
                    {missingCount} language{missingCount === 1 ? '' : 's'} still need a label.
                </Text>
            ) : null}
        </Stack>
    );
}

export function buildMenuItemTranslationsPayload(
    value: TMenuItemLabelTranslations,
): Array<{ language_id: number; label: string }> {
    return Object.entries(value)
        .filter(([, label]) => typeof label === 'string' && label.trim() !== '')
        .map(([languageId, label]) => ({
            language_id: Number(languageId),
            label: label.trim(),
        }))
        .filter((row) => Number.isFinite(row.language_id));
}

export function translationsRecordFromItem(
    translations: Array<{ language_id: number; label: string | null }> | undefined,
    fallbackLabel: string | null | undefined,
    defaultLanguageId: number,
): TMenuItemLabelTranslations {
    const record: TMenuItemLabelTranslations = {};
    for (const row of translations ?? []) {
        if (row.label) {
            record[row.language_id] = row.label;
        }
    }
    if (Object.keys(record).length === 0 && fallbackLabel) {
        record[defaultLanguageId] = fallbackLabel;
    }

    return record;
}
