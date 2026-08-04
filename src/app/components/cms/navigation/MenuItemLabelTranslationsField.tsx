/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { Badge, Group, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { usePublicLanguages } from '../../../../hooks/useLanguages';
import type { IAdminNavigationMenuItemTranslation } from '../../../../api/admin/navigation.api';

export interface IMenuItemTranslationDraft {
    label: string;
    description: string;
    aria_label: string;
}

export type TMenuItemTranslations = Record<number, IMenuItemTranslationDraft>;

const EMPTY_DRAFT: IMenuItemTranslationDraft = { label: '', description: '', aria_label: '' };

interface IMenuItemLabelTranslationsFieldProps {
    value: TMenuItemTranslations;
    onChange: (value: TMenuItemTranslations) => void;
    label?: string;
    description?: string;
    required?: boolean;
    placeholder?: string;
    /** Show the description + ARIA label presentation fields (default true). */
    withPresentationFields?: boolean;
    /**
     * Show the Label input (default true). Page items hide it — their menu
     * label always comes from the page title; only the presentation fields
     * (description / ARIA label) are stored per language.
     */
    withLabelField?: boolean;
}

export function MenuItemLabelTranslationsField({
    value,
    onChange,
    label = 'Label translations',
    description,
    required = false,
    placeholder,
    withPresentationFields = true,
    withLabelField = true,
}: IMenuItemLabelTranslationsFieldProps): React.ReactElement {
    const { languages: languagesData } = usePublicLanguages();
    const [activeLanguage, setActiveLanguage] = useState<string>('');

    const languagesWithStatus = (languagesData ?? []).map((language) => {
        const draft = value[language.id];
        const translated = withLabelField
            ? (draft?.label ?? '').trim()
            : `${draft?.description ?? ''}${draft?.aria_label ?? ''}`.trim();

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

    const handleFieldChange = (field: keyof IMenuItemTranslationDraft, nextValue: string) => {
        const languageId = Number(activeLanguage);
        if (!Number.isFinite(languageId)) {
            return;
        }
        onChange({
            ...value,
            [languageId]: {
                ...(value[languageId] ?? EMPTY_DRAFT),
                [field]: nextValue,
            },
        });
    };

    const missingCount = languagesWithStatus.filter((entry) => !entry.hasTranslation).length;
    const hasAnyLabel = hasAnyMenuItemLabel(value);
    const activeDraft = activeLanguageData ? value[activeLanguageData.id] ?? EMPTY_DRAFT : EMPTY_DRAFT;

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
                <>
                    {withLabelField ? (
                        <TextInput
                            label="Label"
                            value={activeDraft.label}
                            onChange={(event) => handleFieldChange('label', event.currentTarget.value)}
                            placeholder={
                                placeholder
                                ?? `Enter label for ${activeLanguageData.language}`
                            }
                            required={required}
                            error={required && !hasAnyLabel ? 'Label is required' : undefined}
                        />
                    ) : null}
                    {withPresentationFields ? (
                        <>
                            <Textarea
                                label="Description"
                                autosize
                                minRows={1}
                                maxRows={3}
                                value={activeDraft.description}
                                onChange={(event) => handleFieldChange('description', event.currentTarget.value)}
                                placeholder="Optional — shown under mega-menu entries and footer column headings"
                            />
                            <TextInput
                                label="ARIA label"
                                value={activeDraft.aria_label}
                                onChange={(event) => handleFieldChange('aria_label', event.currentTarget.value)}
                                placeholder="Optional — screen-reader text when the label alone is not descriptive"
                            />
                        </>
                    ) : null}
                </>
            ) : null}

            {required && !hasAnyLabel ? (
                <Text size="xs" c="red">
                    A label is required in at least one language before this item can be saved.
                </Text>
            ) : required && missingCount > 0 ? (
                <Text size="xs" c="orange">
                    {missingCount} language{missingCount === 1 ? '' : 's'} still need a label.
                    {' '}
                    Missing translations fall back to a language that has one.
                </Text>
            ) : null}
        </Stack>
    );
}

/**
 * True when at least one language carries a label. The public menu falls back
 * across languages, so a single label is enough to render the item — missing
 * per-language translations stay a soft warning inside the field.
 */
export function hasAnyMenuItemLabel(value: TMenuItemTranslations): boolean {
    return Object.values(value).some((draft) => draft.label.trim() !== '');
}

export function buildMenuItemTranslationsPayload(
    value: TMenuItemTranslations,
): Array<{ language_id: number; label: string | null; description: string | null; aria_label: string | null }> {
    return Object.entries(value)
        .map(([languageId, draft]) => ({
            language_id: Number(languageId),
            label: draft.label.trim() === '' ? null : draft.label.trim(),
            description: draft.description.trim() === '' ? null : draft.description.trim(),
            aria_label: draft.aria_label.trim() === '' ? null : draft.aria_label.trim(),
        }))
        .filter((row) => Number.isFinite(row.language_id)
            && (row.label !== null || row.description !== null || row.aria_label !== null));
}

export function translationsRecordFromItem(
    translations: IAdminNavigationMenuItemTranslation[] | undefined,
    fallbackLabel: string | null | undefined,
    defaultLanguageId: number,
): TMenuItemTranslations {
    const record: TMenuItemTranslations = {};
    for (const row of translations ?? []) {
        record[row.language_id] = {
            label: row.label ?? '',
            description: row.description ?? '',
            aria_label: row.aria_label ?? '',
        };
    }
    if (Object.keys(record).length === 0 && fallbackLabel) {
        record[defaultLanguageId] = { ...EMPTY_DRAFT, label: fallbackLabel };
    }

    return record;
}
