'use client';

import {
    Stack,
    Tabs,
    Alert
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { ReactNode } from 'react';
import { IFieldData } from '../field-renderer/FieldRenderer';
import { ILanguage } from '../field-form-handler/FieldFormHandler';

interface IContentFieldsSectionProps {
    fields: IFieldData[];
    languages: ILanguage[];
    hasMultipleLanguages: boolean;
    activeLanguageTab: string;
    onLanguageTabChange: (value: string | null) => void;
    renderField: (field: IFieldData, languageId: number) => ReactNode;
    className?: string;
}

export function ContentFieldsSection({
    fields,
    languages,
    hasMultipleLanguages,
    activeLanguageTab,
    onLanguageTabChange,
    renderField,
    className
}: IContentFieldsSectionProps) {
    if (fields.length === 0) {
        return (
            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                No content fields available for this page.
            </Alert>
        );
    }

    if (hasMultipleLanguages) {
        return (
            <Tabs value={activeLanguageTab} onChange={onLanguageTabChange}>
                <Tabs.List>
                    {languages.map(lang => {
                        const langId = lang.id.toString();
                        return (
                            <Tabs.Tab key={langId} value={langId}>
                                {lang.language}
                            </Tabs.Tab>
                        );
                    })}
                </Tabs.List>

                {languages.map(lang => {
                    const langId = lang.id.toString();
                    return (
                        <Tabs.Panel key={langId} value={langId} pt="md">
                            <Stack gap="md" className={className}>
                                {fields.map(field => 
                                    renderField(field, lang.id)
                                )}
                            </Stack>
                        </Tabs.Panel>
                    );
                })}
            </Tabs>
        );
    }

    return (
        <Stack gap="md" className={className}>
            {fields.map(field => 
                renderField(field, languages[0]?.id || 1) // Default to first language
            )}
        </Stack>
    );
}
