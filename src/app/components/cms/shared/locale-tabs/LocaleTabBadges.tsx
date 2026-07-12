/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Badge, Group } from '@mantine/core';

export interface ILocaleTabLanguage {
    id: number;
    language: string;
    locale?: string;
    hasTranslation?: boolean;
}

interface ILocaleTabBadgesProps {
    languages: ILocaleTabLanguage[];
    activeLanguageId: string;
    onActiveLanguageChange: (languageId: string) => void;
    size?: 'xs' | 'sm';
}

export function LocaleTabBadges({
    languages,
    activeLanguageId,
    onActiveLanguageChange,
    size = 'xs',
}: ILocaleTabBadgesProps): React.ReactElement {
    return (
        <Group gap={4} wrap="nowrap">
            {languages.map((language) => {
                const isActive = activeLanguageId === String(language.id);
                const hasTranslation = language.hasTranslation === true;
                return (
                    <Badge
                        key={language.id}
                        size={size}
                        variant={isActive ? 'filled' : hasTranslation ? 'light' : 'outline'}
                        color={isActive ? 'blue' : hasTranslation ? 'green' : 'gray'}
                        style={{ cursor: 'pointer', minWidth: 24, textAlign: 'center' }}
                        onClick={() => onActiveLanguageChange(String(language.id))}
                        aria-pressed={isActive}
                        aria-label={`Edit ${language.language}${language.locale ? ` (${language.locale})` : ''}`}
                    >
                        {language.locale ?? language.language}
                    </Badge>
                );
            })}
        </Group>
    );
}
